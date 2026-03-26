import random
import numpy as np
from typing import Dict

from app.models.process_data import ProcessData
from app.ml.predict import predict_emissions


def run_monte_carlo_simulation(
    process: ProcessData,
    n_runs: int = 1000
) -> Dict:
    """
    Run Monte Carlo uncertainty analysis for CO2 emissions.

    Parameters:
    - process: ProcessData SQLAlchemy object
    - n_runs: Number of simulation runs (default: 1000)

    Returns:
    - Statistical summary of CO2 distribution
    """

    co2_results = []

    # ----------------------------
    # Base input values
    # ----------------------------
    base_inputs = {
        "raw_material_type": process.raw_material_type,
        "material_type": process.material_type,
        "energy_source_type": process.energy_source_type,

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

    # ----------------------------
    # Monte Carlo simulation
    # ----------------------------
    for _ in range(n_runs):
        perturbed_inputs = base_inputs.copy()

        # Apply realistic uncertainty ranges
        perturbed_inputs["raw_material_quantity"] *= random.uniform(0.97, 1.03)
        perturbed_inputs["recycled_material_quantity"] *= random.uniform(0.95, 1.05)
        perturbed_inputs["energy_consumption_kwh"] *= random.uniform(0.95, 1.05)
        perturbed_inputs["water_consumption_liters"] *= random.uniform(0.95, 1.05)
        perturbed_inputs["production_volume"] *= random.uniform(0.98, 1.02)

        perturbed_inputs["ore_grade"] *= random.uniform(0.97, 1.03)
        perturbed_inputs["waste_slag_quantity"] *= random.uniform(0.95, 1.05)

        perturbed_inputs["scrap_content_percentage"] *= random.uniform(0.98, 1.02)
        perturbed_inputs["recycling_rate_percentage"] *= random.uniform(0.98, 1.02)

        # Predict emissions
        co2, _, _ = predict_emissions(perturbed_inputs)
        co2_results.append(co2)

    # ----------------------------
    # Statistical summary
    # ----------------------------
    co2_array = np.array(co2_results)

    return {
        "runs": n_runs,
        "mean": round(float(np.mean(co2_array)), 3),
        "min": round(float(np.min(co2_array)), 3),
        "max": round(float(np.max(co2_array)), 3),
        "p5": round(float(np.percentile(co2_array, 5)), 3),
        "p95": round(float(np.percentile(co2_array, 95)), 3),
        "std_dev": round(float(np.std(co2_array)), 3),
    }
