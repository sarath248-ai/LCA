def calculate_lca_impacts(record):
    """
    Compute additional LCA impact categories for a batch
    """

    impacts = {
        "global_warming_kg_co2": round(record.co2_emissions_kg, 2),

        "energy_intensity_kwh_per_ton": round(
            record.energy_consumption_kwh / record.production_volume, 3
        ),

        "water_intensity_l_per_ton": round(
            record.water_consumption_liters / record.production_volume, 3
        ),

        "waste_intensity_kg_per_ton": round(
            record.waste_slag_quantity / record.production_volume, 3
        ),

        "air_pollution_index": round(
            record.sox_emissions_kg + record.nox_emissions_kg, 3
        ),

        "material_circularity_index": round(
            (record.recycled_material_quantity / record.raw_material_quantity)
            * (record.recycling_rate_percentage / 100),
            3
        ),
    }

    return impacts
