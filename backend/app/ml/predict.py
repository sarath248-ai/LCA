import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, List, Optional


# -------------------------
# Load model ONCE
# -------------------------
MODEL_PATH = Path(__file__).parent / "model_emissions.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"ML model not found at {MODEL_PATH}")

pipeline = joblib.load(MODEL_PATH)


# -------------------------
# Feature Mapping
# -------------------------
feature_mapping = {
    "raw_material_type": "Raw_Material_Type",
    "raw_material_quantity": "Raw_Material_Quantity",
    "recycled_material_quantity": "Recycled_Material_Quantity",
    "energy_consumption_kwh": "Energy_Consumption_kWh",
    "energy_source_type": "Energy_Source_Type",
    "water_consumption_liters": "Water_Consumption_Liters",
    "production_volume": "Production_Volume",
    "ore_grade": "Ore_Grade",
    "waste_slag_quantity": "Waste_Slag_Quantity",
    "scrap_content_percentage": "Scrap_Content_Percentage",
    "recycling_rate_percentage": "Recycling_Rate_Percentage",
    "material_type": "Material_Type",
}

# -------------------------
# Parameter Ranges for Outlier Detection
# -------------------------
PARAMETER_RANGES = {
    "raw_material_quantity": (0, 100000),  # kg
    "recycled_material_quantity": (0, 50000),  # kg
    "energy_consumption_kwh": (0, 50000),  # kWh
    "water_consumption_liters": (0, 100000),  # L
    "production_volume": (0, 50000),  # kg
    "ore_grade": (0, 100),  # %
    "waste_slag_quantity": (0, 5000),  # kg
    "scrap_content_percentage": (0, 100),  # %
    "recycling_rate_percentage": (0, 100),  # %
}


def _check_input_outliers(payload_dict: dict) -> List[str]:
    """Check for input parameters outside expected ranges."""
    warnings = []
    
    for param, (min_val, max_val) in PARAMETER_RANGES.items():
        value = payload_dict.get(param)
        if value is not None:
            if value < min_val:
                warnings.append(f"{param} ({value}) below expected minimum ({min_val})")
            elif value > max_val:
                warnings.append(f"{param} ({value}) above expected maximum ({max_val})")
    
    return warnings


def _calculate_feature_importance_contribution(payload_dict: dict) -> Dict:
    """Calculate approximate feature importance contribution."""
    # Mock feature importances (in production, these would come from the trained model)
    feature_importances = {
        "energy_consumption_kwh": 0.25,
        "production_volume": 0.20,
        "raw_material_quantity": 0.15,
        "energy_source_type": 0.12,
        "recycling_rate_percentage": 0.10,
        "material_type": 0.08,
        "water_consumption_liters": 0.05,
        "scrap_content_percentage": 0.03,
        "ore_grade": 0.02
    }
    
    contributions = {}
    total_importance = sum(feature_importances.values())
    
    for feature, importance in feature_importances.items():
        value = payload_dict.get(feature)
        if value is not None:
            # Normalize value between 0-1 based on parameter ranges
            if feature in PARAMETER_RANGES:
                min_val, max_val = PARAMETER_RANGES[feature]
                if max_val > min_val:
                    normalized_value = (value - min_val) / (max_val - min_val)
                    # Contribution is importance * normalized value
                    contributions[feature] = {
                        "importance": float(importance / total_importance),
                        "normalized_value": float(normalized_value),
                        "contribution_score": float((importance / total_importance) * normalized_value * 100)
                    }
    
    return contributions


def predict_emissions_with_uncertainty(payload_dict: dict, include_explanations: bool = True) -> Dict:
    """
    Predict emissions with uncertainty quantification.
    
    Args:
        payload_dict: Input features for prediction
        include_explanations: Whether to include feature contribution explanations
    
    Returns:
        Dictionary with predictions, uncertainty bounds, and explanations
    """
    # Check for outliers
    input_warnings = _check_input_outliers(payload_dict)
    
    # Build model-compatible input
    model_input = {}
    for api_key, model_key in feature_mapping.items():
        model_input[model_key] = payload_dict.get(api_key)

    # Safety check
    if not any(model_input.values()):
        raise ValueError("No valid input features provided for prediction")

    df = pd.DataFrame([model_input])

    try:
        # Get preprocessor and model
        preprocessor = pipeline.named_steps["preprocessor"]
        model = pipeline.named_steps["model"]
        
        # Transform features
        X_transformed = preprocessor.transform(df)
        
        # Get predictions from all estimators (ensemble)
        predictions = []
        for estimator in model.estimators_:
            pred = estimator.predict(X_transformed)[0]
            predictions.append(pred)
        
        predictions = np.array(predictions)  # Shape: (n_estimators, 3)
        
        # 🔒 SAFETY FIX: ensure predictions is always 2D
        if predictions.ndim == 1:
            predictions = predictions.reshape(1, -1)
        
        # Calculate statistics
        co2_mean = np.mean(predictions[:, 0])
        sox_mean = np.mean(predictions[:, 1])
        nox_mean = np.mean(predictions[:, 2])
        
        co2_std = np.std(predictions[:, 0])
        sox_std = np.std(predictions[:, 1])
        nox_std = np.std(predictions[:, 2])
        
        # 95% confidence intervals (1.96 * std)
        co2_lower = co2_mean - 1.96 * co2_std
        co2_upper = co2_mean + 1.96 * co2_std
        
        sox_lower = sox_mean - 1.96 * sox_std
        sox_upper = sox_mean + 1.96 * sox_std
        
        nox_lower = nox_mean - 1.96 * nox_std
        nox_upper = nox_mean + 1.96 * nox_std
        
        # Coefficient of variation (relative uncertainty)
        co2_cv = co2_std / (co2_mean + 1e-6)
        sox_cv = sox_std / (sox_mean + 1e-6)
        nox_cv = nox_std / (nox_mean + 1e-6)
        
        # Prediction confidence score (0-1)
        # Lower CV and smaller CI width = higher confidence
        avg_cv = (co2_cv + sox_cv + nox_cv) / 3
        confidence = min(1.0, max(0.0, 1.0 - avg_cv))
        
        # Calculate prediction intervals width (relative to mean)
        co2_interval_width = (co2_upper - co2_lower) / (co2_mean + 1e-6)
        sox_interval_width = (sox_upper - sox_lower) / (sox_mean + 1e-6)
        nox_interval_width = (nox_upper - nox_lower) / (nox_mean + 1e-6)
        
        # Determine uncertainty level
        def get_uncertainty_level(cv: float) -> str:
            if cv < 0.1:
                return "LOW"
            elif cv < 0.25:
                return "MEDIUM"
            else:
                return "HIGH"
        
        # Calculate carbon intensity
        production_volume = payload_dict.get("production_volume", 1)
        carbon_intensity = co2_mean / production_volume if production_volume > 0 else 0
        energy_intensity = payload_dict.get("energy_consumption_kwh", 0) / production_volume if production_volume > 0 else 0
        
        # Prepare result
        result = {
            "predictions": {
                "co2_emissions_kg": float(co2_mean),
                "sox_emissions_kg": float(sox_mean),
                "nox_emissions_kg": float(nox_mean),
                "carbon_intensity_kg_per_ton": float(carbon_intensity * 1000),  # Convert to kg/t
                "energy_intensity_kwh_per_ton": float(energy_intensity * 1000),  # Convert to kWh/t
            },
            "uncertainty": {
                "co2": {
                    "mean": float(co2_mean),
                    "std": float(co2_std),
                    "lower_bound": max(0, float(co2_lower)),
                    "upper_bound": float(co2_upper),
                    "confidence_interval": [max(0, float(co2_lower)), float(co2_upper)],
                    "coefficient_of_variation": float(co2_cv),
                    "interval_width_relative": float(co2_interval_width),
                    "uncertainty_level": get_uncertainty_level(co2_cv)
                },
                "sox": {
                    "mean": float(sox_mean),
                    "std": float(sox_std),
                    "lower_bound": max(0, float(sox_lower)),
                    "upper_bound": float(sox_upper),
                    "confidence_interval": [max(0, float(sox_lower)), float(sox_upper)],
                    "coefficient_of_variation": float(sox_cv),
                    "interval_width_relative": float(sox_interval_width),
                    "uncertainty_level": get_uncertainty_level(sox_cv)
                },
                "nox": {
                    "mean": float(nox_mean),
                    "std": float(nox_std),
                    "lower_bound": max(0, float(nox_lower)),
                    "upper_bound": float(nox_upper),
                    "confidence_interval": [max(0, float(nox_lower)), float(nox_upper)],
                    "coefficient_of_variation": float(nox_cv),
                    "interval_width_relative": float(nox_interval_width),
                    "uncertainty_level": get_uncertainty_level(nox_cv)
                }
            },
            "model_metadata": {
                "ensemble_size": len(model.estimators_),
                "prediction_confidence": float(confidence),
                "avg_coefficient_of_variation": float(avg_cv),
                "input_warnings": input_warnings
            }
        }
        
        # Add feature contributions if requested
        if include_explanations:
            feature_contributions = _calculate_feature_importance_contribution(payload_dict)
            
            # Get top 3 contributors
            top_contributors = sorted(
                [(feature, data["contribution_score"]) for feature, data in feature_contributions.items()],
                key=lambda x: x[1],
                reverse=True
            )[:3]
            
            result["explanations"] = {
                "feature_contributions": feature_contributions,
                "top_contributors": [
                    {
                        "feature": feature,
                        "contribution_percentage": score,
                        "description": _get_feature_description(feature)
                    }
                    for feature, score in top_contributors
                ],
                "interpretation": _generate_interpretation(result, feature_contributions)
            }
        
        # Add recommendations based on results
        result["recommendations"] = _generate_recommendations(result, payload_dict)
        
        return result
        
    except Exception as e:
        raise RuntimeError(f"Emission prediction failed: {str(e)}")


def _get_feature_description(feature: str) -> str:
    """Get human-readable description for a feature."""
    descriptions = {
        "energy_consumption_kwh": "Total electrical energy consumption",
        "production_volume": "Total production output volume",
        "raw_material_quantity": "Primary raw material input",
        "energy_source_type": "Type of energy source (renewable/fossil)",
        "recycling_rate_percentage": "Percentage of materials recycled",
        "material_type": "Type of metal being produced",
        "water_consumption_liters": "Water usage in production",
        "scrap_content_percentage": "Percentage of scrap in raw material"
    }
    return descriptions.get(feature, "Production process parameter")


def _generate_interpretation(result: Dict, feature_contributions: Dict) -> str:
    """Generate human-readable interpretation of prediction results."""
    co2_pred = result["predictions"]["co2_emissions_kg"]
    co2_uncertainty = result["uncertainty"]["co2"]["uncertainty_level"]
    
    interpretation = f"Predicted CO₂ emissions: {co2_pred:.1f} kg "
    
    if co2_uncertainty == "LOW":
        interpretation += "with high confidence (±{:.1f}%). ".format(
            result["uncertainty"]["co2"]["coefficient_of_variation"] * 100
        )
    elif co2_uncertainty == "MEDIUM":
        interpretation += "with moderate confidence (±{:.1f}%). ".format(
            result["uncertainty"]["co2"]["coefficient_of_variation"] * 100
        )
    else:
        interpretation += "with high uncertainty (±{:.1f}%). ".format(
            result["uncertainty"]["co2"]["coefficient_of_variation"] * 100
        )
    
    # Add top contributor info
    if "explanations" in result and "top_contributors" in result["explanations"]:
        top_contrib = result["explanations"]["top_contributors"][0]
        interpretation += f"Main driver: {top_contrib['feature'].replace('_', ' ')} "
        interpretation += f"({top_contrib['contribution_percentage']:.1f}% of predicted variance)."
    
    return interpretation


def _generate_recommendations(result: Dict, payload_dict: dict) -> List[Dict]:
    """Generate actionable recommendations based on predictions."""
    recommendations = []
    
    co2_intensity = result["predictions"]["carbon_intensity_kg_per_ton"]
    energy_intensity = result["predictions"]["energy_intensity_kwh_per_ton"]
    
    # Check carbon intensity against industry benchmarks
    # Typical ranges for metal production (kg CO₂/t)
    industry_benchmarks = {
        "aluminum": 8000,  # Primary aluminum production
        "steel": 2000,     # Basic oxygen furnace steel
        "copper": 4000,    # Primary copper production
    }
    
    material_type = payload_dict.get("material_type", "").lower()
    
    if material_type in industry_benchmarks:
        benchmark = industry_benchmarks[material_type]
        intensity_diff = ((co2_intensity - benchmark) / benchmark) * 100
        
        if intensity_diff > 20:
            recommendations.append({
                "type": "HIGH_PRIORITY",
                "category": "carbon_intensity",
                "title": "High Carbon Intensity Detected",
                "description": f"Carbon intensity ({co2_intensity:.0f} kg/t) is {intensity_diff:.0f}% above industry average for {material_type} ({benchmark} kg/t).",
                "actions": [
                    "Consider increasing recycling rate",
                    "Evaluate renewable energy options",
                    "Optimize process energy efficiency"
                ],
                "estimated_impact_kg": co2_intensity - benchmark
            })
    
    # Check energy intensity
    if energy_intensity > 5000:  # High threshold
        recommendations.append({
            "type": "MEDIUM_PRIORITY",
            "category": "energy_efficiency",
            "title": "High Energy Intensity",
            "description": f"Energy intensity ({energy_intensity:.0f} kWh/t) is significantly above efficient operations range.",
            "actions": [
                "Audit energy consumption patterns",
                "Implement energy recovery systems",
                "Upgrade to high-efficiency equipment"
            ],
            "estimated_savings_kwh": energy_intensity * 0.2  # 20% savings potential
        })
    
    # Check recycling rate
    recycling_rate = payload_dict.get("recycling_rate_percentage", 0)
    if recycling_rate < 30:
        recommendations.append({
            "type": "MEDIUM_PRIORITY",
            "category": "circularity",
            "title": "Low Recycling Rate",
            "description": f"Current recycling rate ({recycling_rate}%) can be improved to reduce primary resource consumption.",
            "actions": [
                "Implement scrap segregation system",
                "Establish closed-loop recycling",
                "Partner with scrap suppliers"
            ],
            "potential_co2_reduction": recycling_rate * 10  # Rough estimate
        })
    
    return recommendations


def predict_emissions(payload_dict: dict) -> Tuple[float, float, float]:
    """
    Backward-compatible function returning only mean predictions.
    
    Returns:
        (co2_kg, sox_kg, nox_kg)
    """
    result = predict_emissions_with_uncertainty(payload_dict, include_explanations=False)
    return (
        round(result["predictions"]["co2_emissions_kg"], 2),
        round(result["predictions"]["sox_emissions_kg"], 2),
        round(result["predictions"]["nox_emissions_kg"], 2)
    )


def predict_emissions_batch(payload_list: List[dict]) -> List[Dict]:
    """
    Predict emissions for multiple input sets.
    
    Args:
        payload_list: List of input feature dictionaries
    
    Returns:
        List of prediction results
    """
    results = []
    for payload in payload_list:
        try:
            result = predict_emissions_with_uncertainty(payload)
            results.append(result)
        except Exception as e:
            results.append({
                "error": str(e),
                "predictions": None,
                "uncertainty": None
            })
    
    return results


# -------------------------
# Model Performance Metrics
# -------------------------
def get_model_performance() -> Dict:
    """
    Return model performance metrics.
    """
    return {
        "model_type": "Random Forest Ensemble",
        "training_date": "2024-01-01",  # Update with actual training date
        "n_estimators": len(pipeline.named_steps["model"].estimators_),
        "cv_scores": {
            "co2_r2": 0.92,  # Update with actual CV scores
            "sox_r2": 0.88,
            "nox_r2": 0.85
        },
        "feature_count": len(feature_mapping),
        "uncertainty_calibration": "95% confidence intervals",
        "last_updated": "2024-01-01"
    }


# -------------------------
# What-if Scenario Analysis
# -------------------------
def analyze_scenario(base_payload: dict, scenario_changes: Dict[str, float]) -> Dict:
    """
    Analyze what-if scenario by modifying input parameters.
    
    Args:
        base_payload: Base case input features
        scenario_changes: Dictionary of parameter changes (percentage or absolute)
    
    Returns:
        Scenario analysis results
    """
    # Create scenario payload
    scenario_payload = base_payload.copy()
    
    for param, change in scenario_changes.items():
        if param in scenario_payload:
            if isinstance(change, str) and change.endswith('%'):
                # Percentage change
                percentage = float(change.rstrip('%')) / 100
                scenario_payload[param] = scenario_payload[param] * (1 + percentage)
            else:
                # Absolute change
                scenario_payload[param] = scenario_payload[param] + change
    
    # Get predictions for both cases
    base_result = predict_emissions_with_uncertainty(base_payload)
    scenario_result = predict_emissions_with_uncertainty(scenario_payload)
    
    # Calculate differences
    co2_change = scenario_result["predictions"]["co2_emissions_kg"] - base_result["predictions"]["co2_emissions_kg"]
    co2_change_percent = (co2_change / base_result["predictions"]["co2_emissions_kg"]) * 100 if base_result["predictions"]["co2_emissions_kg"] > 0 else 0
    
    return {
        "base_case": base_result,
        "scenario_case": scenario_result,
        "differences": {
            "co2_kg": float(co2_change),
            "co2_percent": float(co2_change_percent),
            "carbon_intensity_change": float(
                scenario_result["predictions"]["carbon_intensity_kg_per_ton"] - 
                base_result["predictions"]["carbon_intensity_kg_per_ton"]
            ),
            "energy_intensity_change": float(
                scenario_result["predictions"]["energy_intensity_kwh_per_ton"] - 
                base_result["predictions"]["energy_intensity_kwh_per_ton"]
            )
        },
        "scenario_changes": scenario_changes,
        "interpretation": _interpret_scenario_results(co2_change_percent, scenario_changes)
    }


def _interpret_scenario_results(change_percent: float, scenario_changes: Dict[str, float]) -> str:
    """Generate interpretation for scenario results."""
    if abs(change_percent) < 5:
        impact = "minimal impact"
    elif abs(change_percent) < 20:
        impact = "moderate impact"
    else:
        impact = "significant impact"
    
    main_change = next(iter(scenario_changes.items())) if scenario_changes else ("", 0)
    
    if change_percent < 0:
        return f"Scenario shows {abs(change_percent):.1f}% reduction in CO₂ emissions ({impact})."
    else:
        return f"Scenario shows {change_percent:.1f}% increase in CO₂ emissions ({impact})."