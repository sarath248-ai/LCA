from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user
from app.ml.predict import predict_emissions_with_uncertainty  # FIXED: Changed import
from app.ml.explain import explain_emissions
from app.ml.optimize import generate_optimization_suggestions

router = APIRouter(
    prefix="/api/optimization",
    tags=["Optimization Engine"]
)


# =====================================================
# Optimization Suggestions
# =====================================================
@router.get("/suggestions/{batch_id}")
def suggest_optimizations(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -------------------------
    # Fetch process data with ownership check
    # -------------------------
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
            detail="Process data not found for this batch"
        )

    # -------------------------
    # Build ML feature payload
    # -------------------------
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

    # -------------------------
    # ML Prediction
    # -------------------------
    # FIXED: Use predict_emissions_with_uncertainty
    result = predict_emissions_with_uncertainty(payload, include_explanations=False)
    co2 = result["predictions"]["co2_emissions_kg"]

    # -------------------------
    # Explainability (SHAP)
    # -------------------------
    explanation = explain_emissions(payload)

    shap_values = [abs(e["contribution"]) for e in explanation]
    features = [e["feature"] for e in explanation]

    # -------------------------
    # Optimization Engine
    # ⚠️ IMPORTANT: positional args ONLY
    # -------------------------
    suggestions = generate_optimization_suggestions(
        shap_values,
        features
    )

    total_impact = sum(s["impact_kg"] for s in suggestions)
    optimized_co2 = max(co2 - total_impact, 0)

    # -------------------------
    # Final Response
    # -------------------------
    return {
        "original_co2_kg": round(co2, 2),
        "optimized_co2_kg": round(optimized_co2, 2),
        "reduction_kg": round(co2 - optimized_co2, 2),
        "reduction_percent": round(
            ((co2 - optimized_co2) / co2) * 100, 2
        ),
        "suggestions": suggestions,
    }