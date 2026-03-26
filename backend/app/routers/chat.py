from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_user
from app.config import OPENROUTER_API_KEY, OPENROUTER_MODEL

router = APIRouter(
    prefix="/api/chat",
    tags=["AI Assistant"]
)

# ==========================
# Request Schema
# ==========================
class ChatRequest(BaseModel):
    question: str


@router.post("/{project_id}")
def chat_with_ai(
    project_id: UUID,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------
    # Validate project ownership
    # --------------------------
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # --------------------------
    # System Prompt (Project-aware)
    # --------------------------
    system_prompt = f"""
You are an expert Life Cycle Assessment (LCA) assistant.

Project context:
- Project Name: {project.name}
- Metal Type: {project.metal_type}
- System Boundary: {project.boundary}

Answer ONLY based on this project.
Be practical, clear, and professional.
"""

    # --------------------------
    # OpenRouter Request
    # --------------------------
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.question},
            ],
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"LLM error: {response.text}",
        )

    answer = response.json()["choices"][0]["message"]["content"]

    return {"answer": answer}