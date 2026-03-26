from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

# Local database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ProfileUpdate(BaseModel):
    name: str
    company: str | None = None


@router.patch("/")
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile information"""
    
    # Update user fields
    current_user.name = payload.name
    if payload.company is not None:
        current_user.company = payload.company
    
    db.commit()
    updated_user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "company": current_user.company
    }


@router.get("/")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "company": current_user.company,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }