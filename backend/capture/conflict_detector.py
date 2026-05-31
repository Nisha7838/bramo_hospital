import json
import numpy as np
from db import get_db

def cosine_similarity(a: list, b: list) -> float:
    va = np.array(a, dtype=float)
    vb = np.array(b, dtype=float)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))

def get_conflict_type(similarity: float) -> str:
    if similarity > 0.95:
        return "DUPLICATE"
    elif similarity > 0.85:
        return "UPDATE"
    elif similarity > 0.70:
        return "COEXIST"
    else:
        return "NEW"

def find_conflicts(candidate_embedding: list, org_id: str, top_k: int = 5) -> list:
    if not candidate_embedding:
        return []

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, title, content, type, department, embedding "
        "FROM knowledge_nodes WHERE org_id = %s AND status = 'ACTIVE' AND embedding IS NOT NULL",
        (org_id,)
    )
    nodes = cursor.fetchall()
    cursor.close()
    conn.close()

    results = []
    for node in nodes:
        raw = node.get("embedding")
        if not raw:
            continue
        node_emb = json.loads(raw) if isinstance(raw, str) else raw
        sim = cosine_similarity(candidate_embedding, node_emb)
        if sim > 0.70:
            results.append({
                "node_id": node["id"],
                "title": node["title"],
                "content": node["content"],
                "type": node["type"],
                "department": node.get("department"),
                "similarity": round(sim, 3),
                "conflict_type": get_conflict_type(sim),
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]
