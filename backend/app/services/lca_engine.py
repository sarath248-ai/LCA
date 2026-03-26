def calculate_lca_metrics(process):
    """
    Calculate core LCA intensity & circularity metrics
    using process-level data.

    This is NOT ML.
    This is deterministic LCA math.
    """

    # -------------------------
    # Safety guards (avoid division by zero)
    # -------------------------
    production_volume = process.production_volume or 1
    raw_material_qty = process.raw_material_quantity or 1
    ore_grade = process.ore_grade or 0.1

    # -------------------------
    # LCA Metrics
    # -------------------------
    energy_intensity = process.energy_consumption_kwh / production_volume
    water_intensity = process.water_consumption_liters / production_volume
    waste_intensity = process.waste_slag_quantity / production_volume

    # Scrap contribution
    scrap_from_raw = (
        raw_material_qty * process.scrap_content_percentage / 100
    )

    material_circularity = (
        process.recycled_material_quantity + scrap_from_raw
    ) / raw_material_qty

    resource_quality_index = 1 / ore_grade

    # -------------------------
    # Final structured output
    # -------------------------
    return {
        "energy_intensity_kwh_per_unit": round(energy_intensity, 4),
        "water_intensity_l_per_unit": round(water_intensity, 4),
        "waste_intensity_kg_per_unit": round(waste_intensity, 4),
        "material_circularity_index": round(material_circularity, 4),
        "resource_quality_index": round(resource_quality_index, 4),
    }
