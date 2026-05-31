import json
import uuid
from db import get_db

LEVEL_MAP = {
    "patient": {"PAT-RAMAIAH": "HL-12-RAMAIAH", "PAT-AADHYA": "HL-12-AADHYA"},
    "department": {"ortho": "HL-05-ORTHO", "medicine": "HL-05-MED", "paediatrics": "HL-05-PAEDS"},
    "hospital": "HL-03",
}

def resolve_level(suggested_level: str, department: str, patient_id: str) -> str:
    if suggested_level == "patient":
        return LEVEL_MAP["patient"].get(patient_id, "HL-03")
    elif suggested_level == "department":
        return LEVEL_MAP["department"].get(department, "HL-03")
    return "HL-03"

def save_candidate(candidate: dict, transcript: str, patient_id: str, user_id: str, org_id: str) -> str:
    conn = get_db()
    cursor = conn.cursor()
    cid = str(uuid.uuid4())
    embedding_json = json.dumps(candidate.get("embedding")) if candidate.get("embedding") else None

    cursor.execute("""
        INSERT INTO capture_candidates
        (id, org_id, transcript, candidate_type, candidate_title, candidate_content,
         importance, confidence, routing_tier, suggested_level, department,
         conflict_type, conflict_node_id, conflict_similarity, status, embedding)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'PENDING',%s)
    """, (
        cid, org_id, transcript,
        candidate.get("type"), candidate.get("title"), candidate.get("content"),
        candidate.get("importance", 0.5), candidate.get("confidence", 0.5),
        candidate.get("routing_tier", "MEDIUM"),
        candidate.get("suggested_level", "patient"),
        candidate.get("department"),
        candidate.get("conflict_type"),
        candidate.get("conflict_node_id"),
        candidate.get("conflict_similarity"),
        embedding_json,
    ))
    cursor.close()
    conn.close()
    return cid

def create_node(candidate_id: str, content: str, ctype: str, title: str,
                importance: float, suggested_level: str, department: str,
                patient_id: str, user_id: str, org_id: str, embedding: list) -> str:
    conn = get_db()
    cursor = conn.cursor()
    nid = "N-" + str(uuid.uuid4())[:8].upper()
    level_id = resolve_level(suggested_level, department, patient_id)
    emb_json = json.dumps(embedding) if embedding else None

    cursor.execute("""
        INSERT INTO knowledge_nodes
        (id, org_id, hierarchy_level_id, type, title, content, importance,
         status, department, zone, embedding, source, created_by)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'ACTIVE',%s,1,%s,'CAPTURE',%s)
    """, (nid, org_id, level_id, ctype, title, content, importance, department, emb_json, user_id))

    cursor.execute("""
        UPDATE capture_candidates SET status='CONFIRMED', node_id=%s,
        reviewed_by=%s, reviewed_at=NOW(), action_taken='CREATED'
        WHERE id=%s
    """, (nid, user_id, candidate_id))

    _log(cursor, "capture_candidate", candidate_id, "CAPTURE_CONFIRMED",
         {"node_id": nid}, user_id, org_id)
    _log(cursor, "knowledge_node", nid, "NODE_CREATED",
         {"source": "CAPTURE", "via": candidate_id}, user_id, org_id)

    cursor.close()
    conn.close()
    return nid

def auto_capture_node(candidate_id: str, patient_id: str, user_id: str, org_id: str) -> str:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM capture_candidates WHERE id=%s", (candidate_id,))
    c = cursor.fetchone()
    cursor.close()
    conn.close()
    if not c:
        raise ValueError("Candidate not found")

    emb = json.loads(c["embedding"]) if c.get("embedding") else None
    return create_node(
        candidate_id, c["candidate_content"], c["candidate_type"], c["candidate_title"],
        float(c["importance"] or 0.5), c["suggested_level"], c["department"],
        patient_id, user_id, org_id, emb
    )

def merge_node(candidate_id: str, target_node_id: str, user_id: str, org_id: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM capture_candidates WHERE id=%s", (candidate_id,))
    c = cursor.fetchone()
    cursor.execute("SELECT * FROM knowledge_nodes WHERE id=%s", (target_node_id,))
    n = cursor.fetchone()

    if not c or not n:
        cursor.close()
        conn.close()
        raise ValueError("Candidate or node not found")

    new_content = n["content"] + "\n[UPDATE] " + c["candidate_content"]
    cursor.execute(
        "UPDATE knowledge_nodes SET content=%s WHERE id=%s",
        (new_content, target_node_id)
    )
    cursor.execute("""
        UPDATE capture_candidates SET status='MERGED', conflict_node_id=%s,
        reviewed_by=%s, reviewed_at=NOW(), action_taken='MERGED'
        WHERE id=%s
    """, (target_node_id, user_id, candidate_id))

    _log(cursor, "knowledge_node", target_node_id, "NODE_MERGED",
         {"candidate_id": candidate_id, "added": c["candidate_content"]}, user_id, org_id)
    cursor.close()
    conn.close()

def dismiss_candidate(candidate_id: str, reason: str, user_id: str, org_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE capture_candidates SET status='DISMISSED', action_reason=%s,
        reviewed_by=%s, reviewed_at=NOW(), action_taken='DISMISSED'
        WHERE id=%s
    """, (reason, user_id, candidate_id))
    _log(cursor, "capture_candidate", candidate_id, "CAPTURE_DISMISSED",
         {"reason": reason}, user_id, org_id)
    cursor.close()
    conn.close()

def undo_capture(candidate_id: str, user_id: str, org_id: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT node_id FROM capture_candidates WHERE id=%s", (candidate_id,))
    row = cursor.fetchone()
    if row and row.get("node_id"):
        cursor.execute("UPDATE knowledge_nodes SET status='DISMISSED' WHERE id=%s", (row["node_id"],))
    cursor.execute("""
        UPDATE capture_candidates SET status='UNDONE', action_taken='UNDONE',
        reviewed_by=%s, reviewed_at=NOW() WHERE id=%s
    """, (user_id, candidate_id))
    _log(cursor, "capture_candidate", candidate_id, "CAPTURE_UNDONE", {}, user_id, org_id)
    cursor.close()
    conn.close()

def _log(cursor, entity_type, entity_id, action, payload, actor_id, org_id):
    lid = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO event_log (id, entity_type, entity_id, action, payload, actor_id, org_id)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (lid, entity_type, entity_id, action, json.dumps(payload), actor_id, org_id))
