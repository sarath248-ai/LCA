from copy import deepcopy
from typing import List, Dict

from app.models.process_data import ProcessData
from app.ml.predict import predict_emissions

# ================================
# Configuration
# ================================

PERTURBATION_PERCENT = 0.10  # ±10% change

# ================================
# Helper: extract numeric features
# ================================
def _get_numeric_features(process: ProcessData) -> Dict[str, float]:
    """
    Extract numeric, sensitivity-relevant features
    from ProcessData safely.
    """
    return {
        "raw_material_quantity": process.raw_material_quantity,
        "recycled_material_quantity": process.recycled_material_quantity,
        "energy_consumption_kwh": process.energy_consumption_kwh,
        "water_consumption_liters": process.water_consumption_liters,
        "production_volume": process.production_volume,
        "ore_grade": process.ore_grade,
        "waste_slag_quantity": process.waste_slag_quantity,
        "scrap_content_percentage": process.scrap_content_percentage,
        "recycling_rate_percentage": process.recycling_rate_percentage,
    }

# ================================
# Sensitivity Analysis Engine
# ================================
def run_sensitivity_analysis(process: ProcessData) -> Dict:
    """
    Performs one-at-a-time sensitivity analysis on
    numeric process parameters.

    Returns CO₂ sensitivity impacts
    in a strict, API-safe format:
    {
        "base_co2": float,
        "results": [
            {"parameter": str, "delta_percent": float}
        ]
    }
    """

    # -------------------------
    # Baseline payload
    # -------------------------
    base_payload = {
        "raw_material_type": process.raw_material_type,
        "material_type": process.material_type,
        "energy_source_type": process.energy_source_type,
        **_get_numeric_features(process),
    }

    base_co2, _, _ = predict_emissions(base_payload)

    cleaned_results: List[Dict] = []

    # -------------------------
    # Iterate each numeric parameter
    # -------------------------
    for param, original_value in _get_numeric_features(process).items():

        # Skip zero or None values to avoid divide-by-zero
        if original_value is None or original_value == 0:
            continue

        # Perturb ±10%
        for factor in [1 + PERTURBATION_PERCENT, 1 - PERTURBATION_PERCENT]:
            modified_payload = deepcopy(base_payload)
            modified_payload[param] = original_value * factor

            new_co2, _, _ = predict_emissions(modified_payload)

            # Compute percent change as float
            delta_percent = ((new_co2 - base_co2) / base_co2) * 100

            cleaned_results.append({
                "parameter": param,
                "delta_percent": round(float(delta_percent), 3),
            })

    # -------------------------
    # Return strict contract
    # -------------------------
    return {
        "base_co2": round(float(base_co2), 3),
        "results": cleaned_results
    }
