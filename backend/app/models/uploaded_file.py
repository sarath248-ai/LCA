import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    content_type = Column(String, nullable=False)
    
    # Optional: associate with project
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Processed data (if applicable)
    rows_processed = Column(Integer, nullable=True)
    columns_processed = Column(Integer, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, processing, processed, error

    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename='{self.filename}', user_id={self.user_id})>"