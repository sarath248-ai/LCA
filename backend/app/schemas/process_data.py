from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class ProcessDataCreate(BaseModel):
    Batch_ID: str
    project_id: UUID

    raw_material_type: str
    material_type: str
    energy_source_type: str

    raw_material_quantity: float
    recycled_material_quantity: float

    energy_consumption_kwh: float
    water_consumption_liters: float
    production_volume: float

    ore_grade: float
    waste_slag_quantity: float

    scrap_content_percentage: float
    recycling_rate_percentage: float


class ProcessDataResponse(ProcessDataCreate):
    co2_emissions_kg: float
    sox_emissions_kg: float
    nox_emissions_kg: float

    class Config:
        from_attributes = True   # Pydantic v2
