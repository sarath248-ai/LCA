from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.process_data import ProcessData
from app.utils.security import get_current_user
from app.ml.predict import predict_emissions_with_uncertainty  # FIXED: Changed import

router = APIRouter(
    prefix="/api/scenario",
    tags=["Scenario"]
)


@router.post("/simulate/{process_id}")
def simulate_scenario(
    process_id: str,          # process_id == batch_id
    changes: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -------------------------
    # Fetch base process data with ownership check
    # -------------------------
    base = (
        db.query(ProcessData)
        .join(Project, ProcessData.project_id == Project.id)
        .filter(
            ProcessData.batch_id == process_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not base:
        raise HTTPException(
            status_code=404,
            detail="Base process data not found"
        )

    # -------------------------
    # Build base payload
    # -------------------------
    base_payload = {
        "raw_material_type": base.raw_material_type,
        "material_type": base.material_type,
        "energy_source_type": base.energy_source_type,
        "raw_material_quantity": base.raw_material_quantity,
        "recycled_material_quantity": base.recycled_material_quantity,
        "energy_consumption_kwh": base.energy_consumption_kwh,
        "water_consumption_liters": base.water_consumption_liters,
        "production_volume": base.production_volume,
        "ore_grade": base.ore_grade,
        "waste_slag_quantity": base.waste_slag_quantity,
        "scrap_content_percentage": base.scrap_content_percentage,
        "recycling_rate_percentage": base.recycling_rate_percentage,
    }

    # -------------------------
    # Predict base emissions
    # -------------------------
    # FIXED: Use predict_emissions_with_uncertainty
    base_result = predict_emissions_with_uncertainty(base_payload, include_explanations=False)
    base_co2 = base_result["predictions"]["co2_emissions_kg"]
    base_sox = base_result["predictions"]["sox_emissions_kg"]
    base_nox = base_result["predictions"]["nox_emissions_kg"]

    # -------------------------
    # Apply scenario changes
    # -------------------------
    scenario_payload = base_payload.copy()
    scenario_payload.update(changes)

    scenario_result = predict_emissions_with_uncertainty(scenario_payload, include_explanations=False)
    scenario_co2 = scenario_result["predictions"]["co2_emissions_kg"]
    scenario_sox = scenario_result["predictions"]["sox_emissions_kg"]
    scenario_nox = scenario_result["predictions"]["nox_emissions_kg"]

    # -------------------------
    # Return comparison
    # -------------------------
    return {
        "base": {
            "co2_emissions_kg": base_co2,
            "sox_emissions_kg": base_sox,
            "nox_emissions_kg": base_nox,
        },
        "scenario": {
            "co2_emissions_kg": scenario_co2,
            "sox_emissions_kg": scenario_sox,
            "nox_emissions_kg": scenario_nox,
        },
        "delta": {
            "co2_emissions_kg": round(scenario_co2 - base_co2, 2),
            "sox_emissions_kg": round(scenario_sox - base_sox, 2),
            "nox_emissions_kg": round(scenario_nox - base_nox, 2),
        },
    }


# ======================================================
# 🔍 SENSITIVITY ANALYSIS (BATCH-BASED)
# ======================================================
@router.post("/sensitivity/{batch_id}")
def sensitivity_analysis(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -------------------------
    # Fetch base process data with ownership check
    # -------------------------
    base = (
        db.query(ProcessData)
        .join(Project, ProcessData.project_id == Project.id)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not base:
        raise HTTPException(
            status_code=404,
            detail="Base process data not found"
        )

    # -------------------------
    # Build base payload
    # -------------------------
    base_payload = {
        "raw_material_type": base.raw_material_type,
        "material_type": base.material_type,
        "energy_source_type": base.energy_source_type,
        "raw_material_quantity": base.raw_material_quantity,
        "recycled_material_quantity": base.recycled_material_quantity,
        "energy_consumption_kwh": base.energy_consumption_kwh,
        "water_consumption_liters": base.water_consumption_liters,
        "production_volume": base.production_volume,
        "ore_grade": base.ore_grade,
        "waste_slag_quantity": base.waste_slag_quantity,
        "scrap_content_percentage": base.scrap_content_percentage,
        "recycling_rate_percentage": base.recycling_rate_percentage,
    }

    # -------------------------
    # Predict base emissions
    # -------------------------
    # FIXED: Use predict_emissions_with_uncertainty
    base_result = predict_emissions_with_uncertainty(base_payload, include_explanations=False)
    base_co2 = base_result["predictions"]["co2_emissions_kg"]

    # -------------------------
    # Sensitivity parameters
    # -------------------------
    parameters = [
        "energy_consumption_kwh",
        "recycling_rate_percentage",
        "scrap_content_percentage",
    ]

    sensitivity_results = []

    # -------------------------
    # Run sensitivity analysis
    # -------------------------
    for param in parameters:
        base_value = base_payload.get(param)

        # Skip if value is missing or zero
        if base_value is None:
            continue

        changed_value = base_value * 1.10  # +10%

        scenario_payload = base_payload.copy()
        scenario_payload[param] = changed_value

        # FIXED: Use predict_emissions_with_uncertainty
        new_result = predict_emissions_with_uncertainty(scenario_payload, include_explanations=False)
        new_co2 = new_result["predictions"]["co2_emissions_kg"]

        delta_co2 = new_co2 - base_co2
        percent_change = (
            (delta_co2 / base_co2) * 100 if base_co2 != 0 else 0
        )

        sensitivity_results.append({
            "parameter": param,
            "base_value": round(base_value, 3),
            "changed_value": round(changed_value, 3),
            "delta_co2_kg": round(delta_co2, 2),
            "percent_change": round(percent_change, 2),
        })

    # -------------------------
    # Final response
    # -------------------------
    return {
        "batch_id": batch_id,
        "sensitivity": sensitivity_results
    }