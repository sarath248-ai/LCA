from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    metal_type: str
    boundary: str

class ProjectResponse(ProjectCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True  # Fixed: Pydantic v2 syntax