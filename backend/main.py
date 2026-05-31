import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json

from db import get_db
from models.candidate import (
    ExtractRequest, ConfirmNodeRequest, MergeNodeRequest, DismissRequest, UndoRequest
)
from capture.extractor import extract_knowledge, get_embedding
from capture.conflict_detector import find_conflicts
from capture.node_creator import (
    save_candidate, create_node, merge_node,
    dismiss_candidate, undo_capture, auto_capture_node
)

load_dotenv()
app = FastAPI(title="BRAHMO Capture API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── USERS ──────────────────────────────────────────────────────────────────
@app.get("/api/users")
def get_users():
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

# ── PATIENTS ───────────────────────────────────────────────────────────────
@app.get("/api/patients")
def get_patients():
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, name, age, gender, conditions, notes FROM patients")
    rows = cur.fetchall()
    for r in rows:
        if isinstance(r.get("conditions"), str):
            r["conditions"] = json.loads(r["conditions"])
    cur.close(); conn.close()
    return rows

# ── NODES ──────────────────────────────────────────────────────────────────
@app.get("/api/nodes")
def get_nodes(org_id: str = "supra"):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id, type, title, content, importance, status, department, hierarchy_level_id, created_at "
        "FROM knowledge_nodes WHERE org_id=%s AND status='ACTIVE' ORDER BY created_at DESC",
        (org_id,)
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

# ── EXTRACT ────────────────────────────────────────────────────────────────
@app.post("/api/extract")
def extract_endpoint(req: ExtractRequest):
    if not req.transcript.strip():
        raise HTTPException(400, "Transcript is empty")

    candidates = extract_knowledge(req.transcript, req.patient_id, req.org_id)

    result = []
    for c in candidates:
        emb = c.get("embedding", [])
        conflicts = find_conflicts(emb, req.org_id) if emb else []
        top = conflicts[0] if conflicts else None

        if top:
            c["conflict_type"] = top["conflict_type"]
            c["conflict_node_id"] = top["node_id"]
            c["conflict_similarity"] = top["similarity"]
            c["conflicts"] = conflicts
        else:
            c["conflict_type"] = "NEW"
            c["conflicts"] = []

        cid = save_candidate(c, req.transcript, req.patient_id, req.user_id, req.org_id)
        c["id"] = cid
        # Remove embedding from response (too large)
        c.pop("embedding", None)
        result.append(c)

    return {"candidates": result, "total": len(result)}

# ── CONFIRM (manual review) ────────────────────────────────────────────────
@app.post("/api/confirm")
def confirm_node(req: ConfirmNodeRequest):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM capture_candidates WHERE id=%s", (req.candidate_id,))
    c = cur.fetchone()
    cur.close(); conn.close()

    if not c:
        raise HTTPException(404, "Candidate not found")

    content   = req.content   or c["candidate_content"]
    ctype     = req.type      or c["candidate_type"]
    level     = req.suggested_level or c["suggested_level"]
    dept      = req.department or c["department"]
    emb       = json.loads(c["embedding"]) if c.get("embedding") else get_embedding(content)

    # Get patient_id from session (stored in transcript? use org default)
    patient_id = _infer_patient(c["transcript"])

    nid = create_node(
        req.candidate_id, content, ctype, c["candidate_title"],
        float(c["importance"] or 0.5), level, dept,
        patient_id, req.user_id, req.org_id, emb
    )
    return {"node_id": nid, "status": "CONFIRMED"}

# ── MERGE ──────────────────────────────────────────────────────────────────
@app.post("/api/merge")
def merge_endpoint(req: MergeNodeRequest):
    merge_node(req.candidate_id, req.target_node_id, req.user_id, req.org_id)
    return {"status": "MERGED", "target_node_id": req.target_node_id}

# ── DISMISS ────────────────────────────────────────────────────────────────
@app.post("/api/dismiss")
def dismiss_endpoint(req: DismissRequest):
    dismiss_candidate(req.candidate_id, req.reason, req.user_id, req.org_id)
    return {"status": "DISMISSED"}

# ── UNDO ───────────────────────────────────────────────────────────────────
@app.post("/api/undo")
def undo_endpoint(req: UndoRequest):
    undo_capture(req.candidate_id, req.user_id, req.org_id)
    return {"status": "UNDONE"}

# ── AUTO-CAPTURE (HIGH tier) ───────────────────────────────────────────────
@app.post("/api/auto-capture")
def auto_capture_endpoint(req: ConfirmNodeRequest):
    patient_id = _infer_patient_from_candidate(req.candidate_id)
    nid = auto_capture_node(req.candidate_id, patient_id, req.user_id, req.org_id)
    return {"node_id": nid, "status": "AUTO_CAPTURED"}

# ── EVENT LOG ──────────────────────────────────────────────────────────────
@app.get("/api/events")
def get_events(org_id: str = "supra", limit: int = 50):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM event_log WHERE org_id=%s ORDER BY timestamp DESC LIMIT %s",
        (org_id, limit)
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

# ── HELPERS ────────────────────────────────────────────────────────────────
def _infer_patient(transcript: str) -> str:
    t = transcript.lower()
    if "aadhya" in t:
        return "PAT-AADHYA"
    return "PAT-RAMAIAH"

def _infer_patient_from_candidate(candidate_id: str) -> str:
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT transcript FROM capture_candidates WHERE id=%s", (candidate_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if row:
        return _infer_patient(row["transcript"])
    return "PAT-RAMAIAH"
