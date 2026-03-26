from sqlalchemy.orm import Session
from app.models.process_data import ProcessData

def build_lca_context(
    db: Session,
    project_id: str | None = None
) -> str:
    """
    Build real-world LCA context from database + ML
    """

    query = db.query(ProcessData)

    if project_id:
        query = query.filter(ProcessData.project_id == project_id)

    records = query.all()

    if not records:
        return "No process data available for this project."

    # FIXED: Use correct lowercase attribute names
    total_co2 = sum(r.co2_emissions_kg or 0 for r in records)
    total_sox = sum(r.sox_emissions_kg or 0 for r in records)
    total_nox = sum(r.nox_emissions_kg or 0 for r in records)

    avg_energy = sum(r.energy_consumption_kwh or 0 for r in records) / len(records)
    avg_recycling = sum(r.recycling_rate_percentage or 0 for r in records) / len(records)

    context = f"""
LCA ANALYTICS SUMMARY:
- Total CO₂ emissions: {total_co2:.2f} kg
- Total SOx emissions: {total_sox:.2f} kg
- Total NOx emissions: {total_nox:.2f} kg

PROCESS INSIGHTS:
- Average energy consumption: {avg_energy:.2f} kWh
- Average recycling rate: {avg_recycling:.2f} %

INTERPRETATION HINTS:
- High energy consumption increases CO₂
- Low recycling rate increases virgin material impact
"""

    return context.strip()