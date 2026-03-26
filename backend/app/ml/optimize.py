def generate_optimization_suggestions(shap_values, feature_names):
    suggestions = []

    for feature, value in zip(feature_names, shap_values):
        if value <= 0:
            continue

        if "Energy_Consumption_kWh" in feature:
            suggestions.append({
                "parameter": "Energy Consumption",
                "recommendation": "Reduce energy usage or switch to renewable energy",
                "impact_kg": round(value, 2)
            })

        elif "Recycling_Rate_Percentage" in feature:
            suggestions.append({
                "parameter": "Recycling Rate",
                "recommendation": "Increase recycled material usage",
                "impact_kg": round(value, 2)
            })

        elif "Waste_Slag_Quantity" in feature:
            suggestions.append({
                "parameter": "Waste Generation",
                "recommendation": "Improve slag recovery and waste handling",
                "impact_kg": round(value, 2)
            })

    return suggestions[:5]
