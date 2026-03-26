import joblib
import shap
import pandas as pd
from pathlib import Path

# -------------------------
# Load model
# -------------------------
MODEL_PATH = Path(__file__).parent / "model_emissions.pkl"
pipeline = joblib.load(MODEL_PATH)

preprocessor = pipeline.named_steps["preprocessor"]
model = pipeline.named_steps["model"]

# Tree-based model
explainer = shap.TreeExplainer(model.estimators_[0])

# -------------------------
# FEATURE NAME MAPPING
# -------------------------
FEATURE_NAME_MAP = {
    "raw_material_type": "Raw_Material_Type",
    "material_type": "Material_Type",
    "energy_source_type": "Energy_Source_Type",
    "raw_material_quantity": "Raw_Material_Quantity",
    "recycled_material_quantity": "Recycled_Material_Quantity",
    "energy_consumption_kwh": "Energy_Consumption_kWh",
    "water_consumption_liters": "Water_Consumption_Liters",
    "production_volume": "Production_Volume",
    "ore_grade": "Ore_Grade",
    "waste_slag_quantity": "Waste_Slag_Quantity",
    "scrap_content_percentage": "Scrap_Content_Percentage",
    "recycling_rate_percentage": "Recycling_Rate_Percentage",
}

# -------------------------
# Explain function
# -------------------------
def explain_emissions(payload_dict: dict):
    """
    Returns top SHAP contributors for CO₂ prediction
    """

    # Convert snake_case → model feature names
    model_payload = {
        FEATURE_NAME_MAP[k]: v
        for k, v in payload_dict.items()
        if k in FEATURE_NAME_MAP
    }

    try:
        X = pd.DataFrame([model_payload])
        X_transformed = preprocessor.transform(X)

        shap_values = explainer.shap_values(X_transformed)[0]
        feature_names = preprocessor.get_feature_names_out()

        explanation = [
            {
                "feature": feature_names[i],
                "contribution": float(shap_values[i]),
            }
            for i in range(len(feature_names))
        ]

        explanation.sort(
            key=lambda x: abs(x["contribution"]),
            reverse=True,
        )

        return explanation[:10]

    except Exception as e:
        raise RuntimeError(f"SHAP explanation failed: {str(e)}")
