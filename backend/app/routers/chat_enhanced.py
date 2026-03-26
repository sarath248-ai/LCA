from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
from uuid import UUID
from pydantic import BaseModel
from enum import Enum
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_user
from app.config import OPENROUTER_API_KEY

router = APIRouter(
    prefix="/api/chat-enhanced",
    tags=["Enhanced AI Chat"]
)

class ChatMode(str, Enum):
    CONTEXT_AWARE = "context_aware"
    QUICK_ACTION = "quick_action"
    EXPLAINER = "explainer"
    ADVANCED_REASONING = "advanced_reasoning"

class ChatRequest(BaseModel):
    question: str
    mode: ChatMode = ChatMode.CONTEXT_AWARE
    temperature: Optional[float] = 0.7

# Model mapping with fallbacks
MODEL_MAP = {
    ChatMode.CONTEXT_AWARE: "mistralai/mistral-7b-instruct",
    ChatMode.QUICK_ACTION: "deepseek/deepseek-chat",
    ChatMode.EXPLAINER: "anthropic/claude-3-haiku",
    ChatMode.ADVANCED_REASONING: "anthropic/claude-3-sonnet"
}

# Fallback models if primary unavailable
FALLBACK_MODELS = {
    "mistralai/mistral-7b-instruct": "openai/gpt-3.5-turbo",
    "deepseek/deepseek-chat": "google/gemma-7b-it",
    "anthropic/claude-3-haiku": "meta-llama/llama-3.1-8b-instruct",
    "anthropic/claude-3-sonnet": "mistralai/mistral-large"
}

def get_system_prompt(mode: ChatMode, project: Project) -> str:
    """Generate system prompt based on chat mode"""
    base_context = f"""
Project Context:
- Name: {project.name}
- Metal Type: {project.metal_type}
- System Boundary: {project.boundary}
- Created: {project.created_at.strftime('%Y-%m-%d') if project.created_at else 'N/A'}
"""
    
    if mode == ChatMode.QUICK_ACTION:
        return f"""You are a quick-response LCA assistant for EcoMetal. Give concise, actionable answers.
{base_context}
Rules:
1. Answer in 1-3 sentences max
2. Focus on immediate actions
3. Use bullet points if helpful
4. No explanations unless asked"""
    
    elif mode == ChatMode.EXPLAINER:
        return f"""You are an LCA tutor for EcoMetal. Explain concepts clearly with examples.
{base_context}
Rules:
1. Explain like teaching to an engineer
2. Use analogies and examples
3. Break down complex concepts
4. Ask clarifying questions if needed
5. Provide references to ISO standards"""
    
    elif mode == ChatMode.ADVANCED_REASONING:
        return f"""You are an advanced LCA analyst for EcoMetal. Provide deep technical insights.
{base_context}
Rules:
1. Show multi-step reasoning
2. Cite specific data or research
3. Discuss uncertainties and limitations
4. Consider alternative interpretations
5. Provide quantitative estimates when possible"""
    
    else:  # CONTEXT_AWARE (default)
        return f"""You are an expert Life Cycle Assessment (LCA) assistant for EcoMetal.
{base_context}
Instructions:
1. Answer based ONLY on this project context
2. Be practical, clear, and professional
3. Suggest optimization opportunities
4. Mention relevant ISO standards
5. If uncertain, say so and explain why"""

@router.post("/{project_id}")
def chat_with_ai_enhanced(
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
    # Select model
    # --------------------------
    primary_model = MODEL_MAP[payload.mode]
    model_to_use = primary_model
    
    system_prompt = get_system_prompt(payload.mode, project)

    # --------------------------
    # OpenRouter Request with error handling
    # --------------------------
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ecometal-lca.com",
            },
            json={
                "model": model_to_use,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": payload.question},
                ],
                "temperature": payload.temperature,
                "max_tokens": 2000,
            },
            timeout=30,
        )

        if response.status_code != 200:
            # Try fallback model
            fallback_model = FALLBACK_MODELS.get(primary_model, "openai/gpt-3.5-turbo")
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": fallback_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": payload.question},
                    ],
                    "temperature": payload.temperature,
                },
                timeout=30,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"All models failed: {response.text}",
                )
            
            model_to_use = fallback_model

        answer = response.json()["choices"][0]["message"]["content"]
        
        # Extract token usage if available
        usage = response.json().get("usage", {})
        token_count = usage.get("total_tokens", 0)

        return {
            "answer": answer,
            "mode": payload.mode,
            "model_used": model_to_use,
            "tokens": token_count,
            "temperature": payload.temperature
        }

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="AI service timeout. Please try again."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )

@router.get("/models/available")
def get_available_models():
    """Return available chat models and their capabilities"""
    return {
        "modes": {
            "context_aware": {
                "model": MODEL_MAP[ChatMode.CONTEXT_AWARE],
                "description": "Balanced expert responses with project context",
                "best_for": "General questions, optimization ideas"
            },
            "quick_action": {
                "model": MODEL_MAP[ChatMode.QUICK_ACTION],
                "description": "Fast, concise answers for quick decisions",
                "best_for": "Immediate actions, simple queries"
            },
            "explainer": {
                "model": MODEL_MAP[ChatMode.EXPLAINER],
                "description": "Educational responses with detailed explanations",
                "best_for": "Learning, concept explanations"
            },
            "advanced_reasoning": {
                "model": MODEL_MAP[ChatMode.ADVANCED_REASONING],
                "description": "Deep technical analysis with multi-step reasoning",
                "best_for": "Complex analysis, research questions"
            }
        }
    }