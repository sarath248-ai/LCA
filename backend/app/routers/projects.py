from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)

# -------------------------
# Pydantic Schemas
# -------------------------

class ProjectCreate(BaseModel):
    name: str
    metal_type: str
    boundary: str


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    metal_type: str
    boundary: str
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Routes
# -------------------------

@router.post("/", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if project with same name exists for this user
    existing = db.query(Project).filter(
        Project.name == payload.name,
        Project.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists")
    
    project = Project(
        **payload.model_dump(),
        user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns list of projects for the current user only"""
    return db.query(Project).filter(
        Project.user_id == current_user.id
    ).order_by(Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}