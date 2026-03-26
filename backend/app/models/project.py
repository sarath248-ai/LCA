import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Add user_id to associate projects with users
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(String(255), nullable=False)
    metal_type = Column(String(100), nullable=False)
    boundary = Column(String(100), nullable=False)

    workspace_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # ISO 14040/14044 Compliance Fields
    goal_and_scope = Column(Text, nullable=True)
    functional_unit = Column(String, nullable=True)
    system_boundary_justification = Column(Text, nullable=True)
    allocation_method = Column(String, nullable=True)
    cutoff_criteria = Column(String, nullable=True)
    data_quality_requirements = Column(Text, nullable=True)
    
    # Compliance status
    iso_compliance_score = Column(Integer, default=0)  # 0-100
    last_compliance_check = Column(DateTime, nullable=True)

    process_data = relationship(
        "ProcessData",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Project(id={self.id}, "
            f"name='{self.name}', "
            f"user_id={self.user_id}, "
            f"metal_type='{self.metal_type}', "
            f"boundary='{self.boundary}', "
            f"iso_compliance_score={self.iso_compliance_score})>"
        )