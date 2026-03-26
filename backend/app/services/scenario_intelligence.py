from app.services.sensitivity_analysis import run_sensitivity_analysis


def build_scenario_intelligence(process_record):
    """
    Converts sensitivity results into ranked decision insights
    """

    # Get sensitivity results from the engine
    sensitivity = run_sensitivity_analysis(process_record)

    # Robust sorting: numeric delta_percent, descending absolute impact
    ranked = sorted(
        sensitivity["results"],
        key=lambda x: abs(float(x["delta_percent"])),
        reverse=True
    )

    insights = []
    for item in ranked:
        value = float(item["delta_percent"])

        insights.append({
            "parameter": item["parameter"],
            "impact_percent": round(value, 2),
            "direction": "increase" if value > 0 else "decrease",
            "priority": "HIGH" if abs(value) > 10 else "MEDIUM"
        })

    return {
        "base_co2": sensitivity["base_co2"],
        "decision_levers": insights
    }
