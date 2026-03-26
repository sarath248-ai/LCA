from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import SECRET_KEY, ALGORITHM
from app.database import SessionLocal
from app.models.user import User
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# 🔐 INTERNAL: normalize password (prevents bcrypt 72-byte crash)
def _normalize_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_normalize_password(password))


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(_normalize_password(password), hashed)


def create_access_token(data: dict, expires_delta: int = 60) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing the token payload. MUST include "sub" (subject).
        expires_delta: Token expiration time in minutes (default: 60 minutes).
    
    Returns:
        JWT token string.
    
    Raises:
        ValueError: If "sub" field is missing from the payload.
    """
    to_encode = data.copy()

    # ✅ ENSURE "sub" IS SET (MANDATORY FOR JWT STANDARD)
    if "sub" not in to_encode:
        raise ValueError("Token payload must include 'sub' (subject) field")

    # Set expiration
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})

    # Encode and return JWT token
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    """
    Database session dependency for FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token from Authorization header.
        db: Database session.
    
    Returns:
        User object if authentication succeeds.
    
    Raises:
        HTTPException: 401 Unauthorized if token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # Decode and validate JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # ✅ Extract user identifier from "sub" field (JWT standard)
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError as e:
        raise credentials_exception

    # Find user by email (subject)
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user