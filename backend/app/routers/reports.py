from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from pathlib import Path
from datetime import datetime

import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

# Directory to store generated reports
REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(exist_ok=True)


# =====================================================
# EXCEL REPORT (BATCH LEVEL)
# =====================================================
@router.get("/excel/{batch_id}")
def generate_excel_report(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(ProcessData)
        .join(Project, ProcessData.project_id == Project.id)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Excel-safe data (NO timezone-aware datetime)
    data = [{
        "Batch ID": record.batch_id,
        "Project ID": str(record.project_id),
        "Raw Material Type": record.raw_material_type,
        "Material Type": record.material_type,
        "Energy Source": record.energy_source_type,
        "Raw Material Quantity": record.raw_material_quantity,
        "Recycled Material Quantity": record.recycled_material_quantity,
        "Energy Consumption (kWh)": record.energy_consumption_kwh,
        "Water Consumption (Liters)": record.water_consumption_liters,
        "Production Volume": record.production_volume,
        "Ore Grade": record.ore_grade,
        "Waste Slag Quantity": record.waste_slag_quantity,
        "Scrap Content (%)": record.scrap_content_percentage,
        "Recycling Rate (%)": record.recycling_rate_percentage,
        "CO2 Emissions (kg)": record.co2_emissions_kg,
        "SOx Emissions (kg)": record.sox_emissions_kg,
        "NOx Emissions (kg)": record.nox_emissions_kg,
        "Created At": record.created_at.isoformat() if record.created_at else None,
    }]

    df = pd.DataFrame(data)

    file_path = REPORT_DIR / f"process_report_{batch_id}.xlsx"
    df.to_excel(file_path, index=False)

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# =====================================================
# PDF REPORT (BATCH LEVEL)
# =====================================================
@router.get("/pdf/{batch_id}")
def generate_pdf_report(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(ProcessData)
        .join(Project, ProcessData.project_id == Project.id)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Batch not found")

    file_path = REPORT_DIR / f"process_report_{batch_id}.pdf"

    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4

    y = height - 50
    line_gap = 18

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "EcoMetal – Process Emissions Report")
    y -= 2 * line_gap

    c.setFont("Helvetica", 11)

    fields = [
        ("Batch ID", record.batch_id),
        ("Project ID", str(record.project_id)),
        ("Raw Material Type", record.raw_material_type),
        ("Material Type", record.material_type),
        ("Energy Source", record.energy_source_type),
        ("Energy Consumption (kWh)", record.energy_consumption_kwh),
        ("Water Consumption (Liters)", record.water_consumption_liters),
        ("Production Volume", record.production_volume),
        ("Ore Grade", record.ore_grade),
        ("Waste Slag Quantity", record.waste_slag_quantity),
        ("Scrap Content (%)", record.scrap_content_percentage),
        ("Recycling Rate (%)", record.recycling_rate_percentage),
        ("CO2 Emissions (kg)", record.co2_emissions_kg),
        ("SOx Emissions (kg)", record.sox_emissions_kg),
        ("NOx Emissions (kg)", record.nox_emissions_kg),
        ("Generated At", datetime.utcnow().isoformat()),
    ]

    for label, value in fields:
        c.drawString(50, y, f"{label}: {value}")
        y -= line_gap

        if y < 50:  # New page if needed
            c.showPage()
            c.setFont("Helvetica", 11)
            y = height - 50

    c.showPage()
    c.save()

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/pdf"
    )