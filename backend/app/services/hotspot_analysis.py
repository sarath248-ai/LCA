def analyze_hotspots(record):
    """
    Perform LCA hotspot analysis on a single batch
    """

    benchmarks = {
        "energy_consumption_kwh": 3000,
        "raw_material_quantity": 2000,
        "water_consumption_liters": 10000,
        "waste_slag_quantity": 200,
        "recycling_rate_percentage": 100,
    }

    reasons = {
        "energy_consumption_kwh": "High energy intensity per unit production",
        "raw_material_quantity": "High virgin material usage",
        "water_consumption_liters": "High water consumption",
        "waste_slag_quantity": "Excessive waste generation",
        "recycling_rate_percentage": "Low recycling contribution",
    }

    hotspots = []

    for key, benchmark in benchmarks.items():
        value = getattr(record, key)
        score = min(value / benchmark, 1)

        if score >= 0.75:
            severity = "HIGH"
        elif score >= 0.40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        hotspots.append({
            "parameter": key,
            "severity": severity,
            "score": round(score, 2),
            "reason": reasons[key]
        })

    hotspots.sort(key=lambda x: x["score"], reverse=True)

    return hotspots
