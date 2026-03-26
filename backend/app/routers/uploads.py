from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response
from sqlalchemy.orm import Session
import os
from uuid import uuid4, UUID
import pandas as pd
from datetime import datetime
from pydantic import BaseModel  # ADDED

from app.database import get_db
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user
from app.services.file_processor import FileProcessor

router = APIRouter(
    prefix="/api/uploads",
    tags=["File Uploads"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# FIXED: Add request model for process file
class ProcessFileRequest(BaseModel):
    project_id: str


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, Excel or CSV allowed",
        )

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Read and validate if it's a data file
    rows_processed = None
    columns_processed = None
    
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
            rows_processed = len(df)
            columns_processed = len(df.columns)
        elif file_extension in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
            rows_processed = len(df)
            columns_processed = len(df.columns)
    except Exception as e:
        # Don't fail if we can't read the file - might be a PDF
        print(f"Note: Could not read file as data: {str(e)}")

    # Save to database
    uploaded_file = UploadedFile(
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        content_type=file.content_type,
        rows_processed=rows_processed,
        columns_processed=columns_processed,
        status="uploaded"
    )
    
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)

    return {
        "id": str(uploaded_file.id),
        "filename": uploaded_file.original_filename,
        "size": uploaded_file.file_size,
        "rows": rows_processed,
        "columns": columns_processed,
        "uploaded_at": uploaded_file.uploaded_at.isoformat() if uploaded_file.uploaded_at else None,
        "status": "uploaded"
    }


@router.get("/")
def list_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of uploaded files for the current user"""
    uploads = db.query(UploadedFile).filter(
        UploadedFile.user_id == current_user.id
    ).order_by(UploadedFile.uploaded_at.desc()).all()
    
    return [
        {
            "id": str(upload.id),
            "filename": upload.original_filename,
            "size": upload.file_size,
            "content_type": upload.content_type,
            "rows": upload.rows_processed,
            "columns": upload.columns_processed,
            "uploaded_at": upload.uploaded_at.isoformat() if upload.uploaded_at else None,
            "status": upload.status
        }
        for upload in uploads
    ]


@router.delete("/{file_id}")
def delete_upload(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an uploaded file"""
    upload = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    try:
        if os.path.exists(upload.file_path):
            os.remove(upload.file_path)
    except Exception as e:
        print(f"Warning: Could not delete physical file: {str(e)}")
    
    # Delete database record
    db.delete(upload)
    db.commit()
    
    return {"message": "File deleted successfully"}


@router.post("/process/{file_id}")
def process_uploaded_file(
    file_id: str,
    request: ProcessFileRequest,  # FIXED: Changed from query param to body
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process uploaded file and create batches"""
    # Get the uploaded file
    upload = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check project ownership
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Process the file
    batches, warnings, errors = FileProcessor.process_excel_file(
        upload.file_path, 
        str(project.id),
        current_user.id
    )
    
    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "File processing completed with errors",
                "errors": errors[:10],  # Limit to 10 errors
                "warnings": warnings,
                "batches_processed": len(batches)
            }
        )
    
    # Save batches to database
    saved_batches = []
    for batch_data in batches:
        try:
            # Check if batch already exists
            existing = db.query(ProcessData).filter(
                ProcessData.batch_id == batch_data["batch_id"]
            ).first()
            
            if existing:
                warnings.append(f"Batch {batch_data['batch_id']} already exists, skipping")
                continue
            
            process_record = ProcessData(**batch_data)
            db.add(process_record)
            saved_batches.append(batch_data["batch_id"])
            
        except Exception as e:
            errors.append(f"Failed to save batch {batch_data.get('batch_id')}: {str(e)}")
    
    if saved_batches:
        db.commit()
    
    # Update upload status
    upload.status = "processed"
    upload.rows_processed = len(saved_batches)
    db.commit()
    
    return {
        "success": True,
        "message": f"Processed {len(saved_batches)} batches successfully",
        "batches_created": saved_batches,
        "warnings": warnings,
        "errors": errors if errors else None
    }


@router.get("/template/excel")
def download_excel_template(
    current_user: User = Depends(get_current_user)
):
    """Download Excel template for data upload"""
    try:
        excel_data = FileProcessor.generate_template_excel()
        
        return Response(
            content=excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=ecometal_process_data_template.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")


@router.get("/template/csv")
def download_csv_template(
    current_user: User = Depends(get_current_user)
):
    """Download CSV template for data upload"""
    try:
        import io
        import csv
        
        # CSV headers with descriptions as comment
        headers = [
            "Batch ID", "Raw Material Type", "Material Type", "Energy Source Type",
            "Raw Material Quantity", "Recycled Material Quantity", "Energy Consumption",
            "Water Consumption", "Production Volume", "Ore Grade", "Waste Slag Quantity",
            "Scrap Content %", "Recycling Rate %"
        ]
        
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        
        # Write header comment
        writer.writerow(["# EcoMetal LCA Process Data Template"])
        writer.writerow(["# Required fields: Batch ID, Raw Material Quantity, Energy Consumption, Production Volume"])
        writer.writerow(["# All quantities should be in base units (kg, kWh, Liters)"])
        writer.writerow([])
        
        # Write headers
        writer.writerow(headers)
        
        # Write example row
        example = [
            "BATCH_001", "Iron Ore", "Steel", "Electricity",
            "1500", "300", "4500", "2500",
            "1200", "0.65", "150", "20", "25"
        ]
        writer.writerow(example)
        
        csv_data = buffer.getvalue()
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=ecometal_process_data_template.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")