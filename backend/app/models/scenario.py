from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    base_batch_id = Column(String, index=True)

    changes = Column(JSON)

    original_co2 = Column(Float)
    scenario_co2 = Column(Float)
    reduction_percent = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
