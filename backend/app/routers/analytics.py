from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user
from app.services.lca_engine import calculate_lca_metrics
from app.services.hotspot_analysis import analyze_hotspots
from app.services.lca_impacts import calculate_lca_impacts
from app.services.uncertainty import calculate_uncertainty
from app.services.monte_carlo import run_monte_carlo_simulation
from app.services.scenario_intelligence import build_scenario_intelligence
from app.ml.explain import explain_emissions

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

# ================================
# 1️⃣ TOTAL EMISSIONS SUMMARY (PROJECT-BASED)
# ================================
@router.get("/emissions/summary/{project_id}")
def emissions_summary(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = (
        db.query(
            func.coalesce(func.sum(ProcessData.co2_emissions_kg), 0).label("co2"),
            func.coalesce(func.sum(ProcessData.sox_emissions_kg), 0).label("sox"),
            func.coalesce(func.sum(ProcessData.nox_emissions_kg), 0).label("nox"),
        )
        .filter(ProcessData.project_id == project_id)
        .one()
    )

    return {
        "total_co2_kg": round(result.co2, 2),
        "total_sox_kg": round(result.sox, 2),
        "total_nox_kg": round(result.nox, 2),
    }


# ================================
# 2️⃣ CO₂ EMISSIONS TREND (PROJECT + DATE)
# ================================
@router.get("/emissions/trend/{project_id}")
def emissions_trend(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = (
        db.query(
            func.date(ProcessData.created_at).label("date"),
            func.sum(ProcessData.co2_emissions_kg).label("co2"),
        )
        .filter(ProcessData.project_id == project_id)
        .group_by(func.date(ProcessData.created_at))
        .order_by(func.date(ProcessData.created_at))
        .all()
    )

    return [
        {
            "date": row.date.isoformat(),
            "co2_kg": round(row.co2 or 0, 2),
        }
        for row in data
    ]


# ================================
# 3️⃣ LCA METRICS (BATCH-BASED)
# ================================
@router.get("/lca/metrics/{batch_id}")
def get_lca_metrics(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    process = (
        db.query(ProcessData)
        .join(Project, ProcessData.project_id == Project.id)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not process:
        raise HTTPException(
            status_code=404,
            detail="Process batch not found"
        )

    metrics = calculate_lca_metrics(process) or {}

    return {
        "batch_id": batch_id,
        "metrics": metrics
    }


# ================================
# 4️⃣ LCA HOTSPOT ANALYSIS (BATCH-BASED)
# ================================
@router.get("/lca/hotspots/{batch_id}")
def get_lca_hotspots(
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
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    hotspots = analyze_hotspots(record) or []

    return {
        "batch_id": batch_id,
        "hotspots": hotspots
    }


# ================================
# 5️⃣ LCA IMPACT ASSESSMENT (BATCH-BASED)
# ================================
@router.get("/lca/impacts/{batch_id}")
def get_lca_impacts(
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
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    impacts = calculate_lca_impacts(record) or {}

    return {
        "batch_id": batch_id,
        "impacts": impacts
    }


# ================================
# 6️⃣ LCA UNCERTAINTY ANALYSIS (BATCH-BASED)
# ================================
@router.get("/lca/uncertainty/{batch_id}")
def get_lca_uncertainty(
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
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    co2_uncertainty = calculate_uncertainty(record.co2_emissions_kg) or {}

    return {
        "batch_id": batch_id,
        "confidence_level": "95%",
        "co2_emissions": co2_uncertainty.get("co2", 0)
    }


# ================================
# 7️⃣ ML-BASED HOTSPOT EXPLANATION (SHAP)
# ================================
@router.get("/hotspots/{batch_id}")
def get_hotspots(
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
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    payload = {
        "raw_material_type": record.raw_material_type,
        "material_type": record.material_type,
        "energy_source_type": record.energy_source_type,
        "raw_material_quantity": record.raw_material_quantity,
        "recycled_material_quantity": record.recycled_material_quantity,
        "energy_consumption_kwh": record.energy_consumption_kwh,
        "water_consumption_liters": record.water_consumption_liters,
        "production_volume": record.production_volume,
        "ore_grade": record.ore_grade,
        "waste_slag_quantity": record.waste_slag_quantity,
        "scrap_content_percentage": record.scrap_content_percentage,
        "recycling_rate_percentage": record.recycling_rate_percentage,
    }

    explanation = explain_emissions(payload) or []

    hotspots = sorted(
        explanation,
        key=lambda x: abs(x.get("contribution", 0)),
        reverse=True
    )

    return {
        "batch_id": batch_id,
        "hotspots": [
            {
                "parameter": h.get("feature", "unknown"),
                "impact_kg": round(abs(h.get("contribution", 0)), 3),
                "direction": "increase" if h.get("contribution", 0) > 0 else "decrease"
            }
            for h in hotspots
        ]
    }


# ================================
# 8️⃣ IMPACT INTENSITY SUMMARY (PROJECT-BASED)
# ================================
@router.get("/impact-summary/{project_id}")
def impact_summary(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = (
        db.query(
            func.avg(ProcessData.carbon_intensity_kg_per_ton).label("carbon"),
            func.avg(ProcessData.energy_intensity_kwh_per_ton).label("energy"),
            func.avg(ProcessData.water_intensity_l_per_ton).label("water"),
            func.avg(ProcessData.recycling_efficiency_score).label("recycling"),
        )
        .filter(ProcessData.project_id == project_id)
        .one()
    )

    return {
        "project_id": str(project_id),
        "avg_carbon_intensity_kg_per_ton": round(result.carbon or 0, 3),
        "avg_energy_intensity_kwh_per_ton": round(result.energy or 0, 3),
        "avg_water_intensity_l_per_ton": round(result.water or 0, 3),
        "avg_recycling_efficiency_score": round(result.recycling or 0, 2),
    }


# ================================
# 9️⃣ MONTE CARLO UNCERTAINTY (BATCH-BASED)
# ================================
'''
@router.get("/lca/monte-carlo/{batch_id}")
def monte_carlo_uncertainty(
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
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    results = run_monte_carlo_simulation(record) or {}

    return {
        "batch_id": batch_id,
        "method": "Monte Carlo Simulation",
        "confidence_level": "90%",
        "results": results.get("results", [])
    }
'''


# ================================
# 🔟 SCENARIO INTELLIGENCE (BATCH-BASED)
# ================================
@router.get("/scenario-intelligence/{batch_id}")
def scenario_intelligence(
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

    intelligence = build_scenario_intelligence(record) or {}

    return {
        "batch_id": batch_id,
        "scenario_intelligence": intelligence
    }