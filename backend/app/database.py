from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# -------------------------
# Database Engine
# -------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,    # Check connection before using
    pool_recycle=1800,     # Recycle connections every 30 minutes
)

# -------------------------
# Session Factory
# -------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# -------------------------
# Base class for models
# -------------------------
Base = declarative_base()

# -------------------------
# Dependency for FastAPI
# -------------------------
def get_db():
    """
    Provides a database session for a single request.
    Automatically closes after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
