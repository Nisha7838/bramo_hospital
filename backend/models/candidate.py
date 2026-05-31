from pydantic import BaseModel
from typing import Optional, List

class CaptureCandidate(BaseModel):
    type: str
    title: str
    content: str
    importance: float
    confidence: float
    suggested_level: str
    department: Optional[str] = None
    rationale: str

class ExtractRequest(BaseModel):
    transcript: str
    patient_id: str
    user_id: str
    org_id: str = "supra"

class ConfirmNodeRequest(BaseModel):
    candidate_id: str
    content: Optional[str] = None
    type: Optional[str] = None
    suggested_level: Optional[str] = None
    department: Optional[str] = None
    user_id: str
    org_id: str = "supra"

class MergeNodeRequest(BaseModel):
    candidate_id: str
    target_node_id: str
    user_id: str
    org_id: str = "supra"

class DismissRequest(BaseModel):
    candidate_id: str
    reason: str
    user_id: str
    org_id: str = "supra"

class UndoRequest(BaseModel):
    candidate_id: str
    user_id: str
    org_id: str = "supra"
