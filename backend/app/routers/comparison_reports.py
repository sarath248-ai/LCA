from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user
from app.ml.predict import predict_emissions
from app.ml.explain import explain_emissions
from app.ml.optimize import generate_optimization_suggestions
import pandas as pd
from fastapi.responses import FileResponse
import tempfile

router = APIRouter(
    prefix="/api/comparison",
    tags=["Comparison Reports"]
)

@router.get("/excel/{batch_id}")
def export_comparison_excel(
    batch_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch process data with ownership check
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

    base_payload = {
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

    base_co2, _, _ = predict_emissions(base_payload)

    scenario_payload = base_payload.copy()
    scenario_payload["recycling_rate_percentage"] = 45
    scenario_payload["energy_consumption_kwh"] = 5200
    scenario_co2, _, _ = predict_emissions(scenario_payload)

    explanation = explain_emissions(base_payload)
    shap_vals = [abs(e["contribution"]) for e in explanation]
    features = [e["feature"] for e in explanation]

    suggestions = generate_optimization_suggestions(shap_vals, features)
    optimized_co2 = base_co2 - sum(s["impact_kg"] for s in suggestions)

    df = pd.DataFrame([
        {"Case": "Base", "CO2_kg": round(base_co2, 2)},
        {"Case": "Scenario", "CO2_kg": round(scenario_co2, 2)},
        {"Case": "Optimized", "CO2_kg": round(optimized_co2, 2)},
    ])

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    df.to_excel(tmp.name, index=False)

    return FileResponse(
        tmp.name,
        filename=f"comparison_{batch_id}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )