from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ProcessData(Base):
    __tablename__ = "process_data"

    __table_args__ = (
        Index('ix_process_data_project_id', 'project_id'),
        Index('ix_process_data_created_at', 'created_at'),
    )

    # -------------------------
    # Primary Key
    # -------------------------
    batch_id = Column(String, primary_key=True, index=True)

    # -------------------------
    # Relations
    # -------------------------
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    project = relationship("Project", back_populates="process_data")

    # -------------------------
    # Timestamp
    # -------------------------
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # -------------------------
    # Process Inputs
    # -------------------------
    raw_material_type = Column(String)
    material_type = Column(String)
    energy_source_type = Column(String)

    raw_material_quantity = Column(Float)
    recycled_material_quantity = Column(Float)

    energy_consumption_kwh = Column(Float)
    water_consumption_liters = Column(Float)
    production_volume = Column(Float)

    ore_grade = Column(Float)
    waste_slag_quantity = Column(Float)

    scrap_content_percentage = Column(Float)
    recycling_rate_percentage = Column(Float)

    # -------------------------
    # Emissions (ML outputs)
    # -------------------------
    co2_emissions_kg = Column(Float)
    sox_emissions_kg = Column(Float)
    nox_emissions_kg = Column(Float)

    # -------------------------
    # Uncertainty bounds
    # -------------------------
    co2_lower_bound = Column(Float, nullable=True)
    co2_upper_bound = Column(Float, nullable=True)
    sox_lower_bound = Column(Float, nullable=True)
    sox_upper_bound = Column(Float, nullable=True)
    nox_lower_bound = Column(Float, nullable=True)
    nox_upper_bound = Column(Float, nullable=True)
    prediction_confidence = Column(Float, nullable=True)

    # -------------------------
    # Full uncertainty data (JSON)
    # -------------------------
    uncertainty_data = Column(JSON, nullable=True)
    model_metadata = Column(JSON, nullable=True)

    # -------------------------
    # Derived Intensities & Scores
    # -------------------------
    carbon_intensity_kg_per_ton = Column(Float)
    energy_intensity_kwh_per_ton = Column(Float)
    water_intensity_l_per_ton = Column(Float)
    recycling_efficiency_score = Column(Float)