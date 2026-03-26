from fastapi import APIRouter

router = APIRouter(
    prefix="/api/metadata",
    tags=["Metadata"]
)

@router.get("/options")
def get_options():
    return {
        "metal_types": ["Steel", "Aluminium", "Copper", "Brass", "Other"],
        "boundaries": ["Cradle to Gate", "Cradle to Grave", "Gate to Gate"],
        "energy_sources": ["Electricity", "Coal", "Natural Gas", "Renewable"],
        "raw_material_types": ["Iron Ore", "Bauxite", "Copper Ore", "Aluminum Ore"]
    }