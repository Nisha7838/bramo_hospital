import os
import json
from openai import OpenAI
from fastembed import TextEmbedding
from dotenv import load_dotenv
from prompts.extraction_prompt import EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_TEMPLATE
from capture.confidence_router import route_candidates
from db import get_db

load_dotenv()

# Groq client (OpenAI-compatible, free)
groq = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# Local embedding model (no API key, ~33MB, downloaded once)
_embed_model = None

def _get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _embed_model

def get_embedding(text: str) -> list:
    model = _get_embed_model()
    return list(model.embed([text]))[0].tolist()

def extract_knowledge(transcript: str, patient_id: str, org_id: str) -> list:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT name FROM patients WHERE id = %s", (patient_id,))
    patient = cursor.fetchone()
    patient_name = patient["name"] if patient else "Unknown"

    cursor.execute(
        "SELECT id, type, title, content FROM knowledge_nodes "
        "WHERE org_id = %s AND status = 'ACTIVE' "
        "AND (hierarchy_level_id LIKE %s OR hierarchy_level_id IN ('HL-01','HL-03')) "
        "ORDER BY importance DESC LIMIT 15",
        (org_id, f"%{patient_id.replace('PAT-', '')}%")
    )
    existing = cursor.fetchall()
    cursor.close()
    conn.close()

    existing_json = json.dumps(existing, indent=2) if existing else "[]"
    user_msg = EXTRACTION_USER_TEMPLATE.format(
        transcript=transcript,
        patient_name=patient_name,
        existing_nodes_json=existing_json
    )

    response = groq.chat.completions.create(
        model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg}
        ],
        temperature=0.2,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            candidates = (
                parsed.get("candidates")
                or parsed.get("knowledge")
                or (list(parsed.values())[0] if parsed else [])
            )
        else:
            candidates = parsed
    except json.JSONDecodeError:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        candidates = json.loads(raw[start:end]) if start != -1 and end > start else []

    if not isinstance(candidates, list):
        candidates = []

    candidates = route_candidates(candidates)

    for c in candidates:
        text = f"{c.get('title', '')}: {c.get('content', '')}"
        c["embedding"] = get_embedding(text)

    return candidates
