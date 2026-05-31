const BASE = "";

export async function getUsers() {
  const r = await fetch(`${BASE}/api/users`);
  return r.json();
}

export async function getPatients() {
  const r = await fetch(`${BASE}/api/patients`);
  return r.json();
}

export async function extractKnowledge(payload: {
  transcript: string;
  patient_id: string;
  user_id: string;
  org_id?: string;
}) {
  const r = await fetch(`${BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: "supra", ...payload }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function confirmNode(payload: {
  candidate_id: string;
  content?: string;
  type?: string;
  suggested_level?: string;
  department?: string;
  user_id: string;
}) {
  const r = await fetch(`${BASE}/api/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: "supra", ...payload }),
  });
  return r.json();
}

export async function autoCapture(candidate_id: string, user_id: string) {
  const r = await fetch(`${BASE}/api/auto-capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id, user_id, org_id: "supra" }),
  });
  return r.json();
}

export async function mergeNode(candidate_id: string, target_node_id: string, user_id: string) {
  const r = await fetch(`${BASE}/api/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id, target_node_id, user_id, org_id: "supra" }),
  });
  return r.json();
}

export async function dismissCandidate(candidate_id: string, reason: string, user_id: string) {
  const r = await fetch(`${BASE}/api/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id, reason, user_id, org_id: "supra" }),
  });
  return r.json();
}

export async function undoCapture(candidate_id: string, user_id: string) {
  const r = await fetch(`${BASE}/api/undo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id, user_id, org_id: "supra" }),
  });
  return r.json();
}
