from pydantic import BaseModel
from typing import Optional

class ConflictResult(BaseModel):
    node_id: str
    title: str
    content: str
    type: str
    department: Optional[str]
    similarity: float
    conflict_type: str   # DUPLICATE | UPDATE | COEXIST | NEW
