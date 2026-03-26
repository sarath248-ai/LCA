from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.process_data import ProcessData
from app.models.project import Project
from app.ml.predict import predict_emissions_with_uncertainty  # FIXED: Changed import
from app.ml.explain import explain_emissions
from app.models.user import User
from app.utils.security import get_current_user

from pydantic import BaseModel, ConfigDict

router = APIRouter(
    prefix="/api/process-data",
    tags=["Process Data"]
)

# =====================================================
# Schemas
# =====================================================

class ProcessDataCreate(BaseModel):
    batch_id: str
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


class UncertaintyInfo(BaseModel):
    mean: float
    std: float
    lower_bound: float
    upper_bound: float
    confidence_interval: List[float]
    coefficient_of_variation: float
    interval_width_relative: float
    uncertainty_level: str


class ModelMetadata(BaseModel):
    ensemble_size: int
    prediction_confidence: float
    avg_coefficient_of_variation: float
    input_warnings: List[str] = []


class ProcessDataResponse(ProcessDataCreate):
    co2_emissions_kg: float
    sox_emissions_kg: float
    nox_emissions_kg: float
    
    # Uncertainty fields
    co2_lower_bound: Optional[float] = None
    co2_upper_bound: Optional[float] = None
    sox_lower_bound: Optional[float] = None
    sox_upper_bound: Optional[float] = None
    nox_lower_bound: Optional[float] = None
    nox_upper_bound: Optional[float] = None
    prediction_confidence: Optional[float] = None
    
    # Additional metrics
    carbon_intensity_kg_per_ton: float
    energy_intensity_kwh_per_ton: float
    water_intensity_l_per_ton: float
    recycling_efficiency_score: float
    
    # Full uncertainty info (optional)
    uncertainty_info: Optional[dict] = None
    model_metadata: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class ProcessDataCreateWithUncertainty(ProcessDataCreate):
    include_full_uncertainty: bool = False


class UncertaintyAnalysisResponse(BaseModel):
    predictions: dict
    uncertainty: dict
    model_metadata: dict
    explanations: Optional[dict] = None
    recommendations: Optional[List[dict]] = None


# =====================================================
# Create process data
# =====================================================

@router.post("/", response_model=ProcessDataResponse)
def create_process_data(
    payload: ProcessDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_uncertainty: bool = True
):
    """
    Create new process data with ML predictions.
    
    Args:
        payload: Process data input
        db: Database session
        current_user: Authenticated user
        include_uncertainty: Whether to include full uncertainty analysis
    
    Returns:
        Process data record with predictions
    """
    # Validate project AND ensure it belongs to current user
    project = db.query(Project).filter(
        Project.id == payload.project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Prevent duplicate batch
    if db.query(ProcessData).filter(
        ProcessData.batch_id == payload.batch_id
    ).first():
        raise HTTPException(status_code=400, detail="Batch already exists")

    # -------------------------
    # ML Prediction with Uncertainty
    # -------------------------
    prediction_result = predict_emissions_with_uncertainty(
        payload.model_dump(),
        include_explanations=False
    )
    
    predictions = prediction_result["predictions"]
    uncertainty = prediction_result["uncertainty"]
    model_metadata = prediction_result["model_metadata"]
    
    co2 = predictions["co2_emissions_kg"]
    sox = predictions["sox_emissions_kg"]
    nox = predictions["nox_emissions_kg"]
    
    co2_lower = uncertainty["co2"]["lower_bound"]
    co2_upper = uncertainty["co2"]["upper_bound"]
    sox_lower = uncertainty["sox"]["lower_bound"]
    sox_upper = uncertainty["sox"]["upper_bound"]
    nox_lower = uncertainty["nox"]["lower_bound"]
    nox_upper = uncertainty["nox"]["upper_bound"]
    
    confidence = model_metadata["prediction_confidence"]
    input_warnings = model_metadata["input_warnings"]

    # -------------------------
    # Derived intensity metrics
    # -------------------------
    production_volume_ton = payload.production_volume / 1000  # Convert kg to tons
    
    carbon_intensity = (co2 / production_volume_ton) if production_volume_ton > 0 else 0
    energy_intensity = (payload.energy_consumption_kwh / production_volume_ton) if production_volume_ton > 0 else 0
    water_intensity = (payload.water_consumption_liters / production_volume_ton) if production_volume_ton > 0 else 0
    recycling_efficiency = (
        (payload.recycled_material_quantity / payload.raw_material_quantity) * 100 
        if payload.raw_material_quantity > 0 else 0
    )

    # -------------------------
    # Persist record
    # -------------------------
    record = ProcessData(
        batch_id=payload.batch_id,
        project_id=payload.project_id,

        raw_material_type=payload.raw_material_type,
        material_type=payload.material_type,
        energy_source_type=payload.energy_source_type,

        raw_material_quantity=payload.raw_material_quantity,
        recycled_material_quantity=payload.recycled_material_quantity,

        energy_consumption_kwh=payload.energy_consumption_kwh,
        water_consumption_liters=payload.water_consumption_liters,
        production_volume=payload.production_volume,

        ore_grade=payload.ore_grade,
        waste_slag_quantity=payload.waste_slag_quantity,

        scrap_content_percentage=payload.scrap_content_percentage,
        recycling_rate_percentage=payload.recycling_rate_percentage,

        # ML Predictions
        co2_emissions_kg=co2,
        sox_emissions_kg=sox,
        nox_emissions_kg=nox,
        
        # Uncertainty bounds
        co2_lower_bound=co2_lower,
        co2_upper_bound=co2_upper,
        sox_lower_bound=sox_lower,
        sox_upper_bound=sox_upper,
        nox_lower_bound=nox_lower,
        nox_upper_bound=nox_upper,
        prediction_confidence=confidence,

        # Intensity metrics
        carbon_intensity_kg_per_ton=carbon_intensity,
        energy_intensity_kwh_per_ton=energy_intensity,
        water_intensity_l_per_ton=water_intensity,
        recycling_efficiency_score=recycling_efficiency,
        
        # Full uncertainty data as JSON
        uncertainty_data=uncertainty,
        model_metadata=model_metadata
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # If input warnings exist, log them
    if input_warnings:
        # You might want to log these warnings or store them separately
        print(f"Input warnings for batch {payload.batch_id}: {input_warnings}")

    return record


# =====================================================
# Create with full uncertainty analysis
# =====================================================

@router.post("/with-uncertainty", response_model=UncertaintyAnalysisResponse)
def create_process_data_with_uncertainty(
    payload: ProcessDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create process data and return full uncertainty analysis.
    
    This endpoint provides detailed uncertainty information, explanations,
    and recommendations without saving to database.
    """
    # Validate project AND ensure it belongs to current user
    project = db.query(Project).filter(
        Project.id == payload.project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Prevent duplicate batch (only check if we're saving, but we'll still check for consistency)
    if db.query(ProcessData).filter(
        ProcessData.batch_id == payload.batch_id
    ).first():
        raise HTTPException(status_code=400, detail="Batch already exists")

    # -------------------------
    # ML Prediction with full uncertainty and explanations
    # -------------------------
    prediction_result = predict_emissions_with_uncertainty(
        payload.model_dump(),
        include_explanations=True
    )
    
    # Add batch ID to result
    prediction_result["batch_id"] = payload.batch_id
    prediction_result["project_id"] = payload.project_id
    
    return prediction_result


# =====================================================
# Get by batch_id
# =====================================================

@router.get("/{batch_id}", response_model=ProcessDataResponse)
def get_process_data(
    batch_id: str,
    include_uncertainty: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get process data by batch ID.
    
    Args:
        batch_id: Batch identifier
        include_uncertainty: Whether to include uncertainty info in response
        db: Database session
        current_user: Authenticated user
    """
    # Get record and verify project ownership
    record = (
        db.query(ProcessData)
        .join(Project)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Process data not found")

    response_data = {
        **record.__dict__,
        "uncertainty_info": record.uncertainty_data if include_uncertainty and record.uncertainty_data else None,
        "model_metadata": record.model_metadata if include_uncertainty and record.model_metadata else None
    }
    
    return ProcessDataResponse(**response_data)


# =====================================================
# Get uncertainty analysis for existing batch
# =====================================================

@router.get("/{batch_id}/uncertainty")
def get_process_data_uncertainty(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed uncertainty analysis for an existing batch.
    """
    # Get record and verify project ownership
    record = (
        db.query(ProcessData)
        .join(Project)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Process data not found")

    # Prepare payload for prediction
    payload = {
        "raw_material_type": record.raw_material_type,
        "material_type": record.material_type,
        "energy_source_type": record.energy_source_type,
        "raw_material_quantity": record.raw_material_quantity,
        "recycled_material_quantity": record.recycled_material_quantity,
        "energy_consumption_kwh": record.energy_consumption_kwh,
        "water_consumption_liters": record.water_consumption_liters,
        "production_volume": record.production_volume,
        "ore_grade": record.ore_grade,
        "waste_slag_quantity": record.waste_slag_quantity,
        "scrap_content_percentage": record.scrap_content_percentage,
        "recycling_rate_percentage": record.recycling_rate_percentage,
    }

    # Get full uncertainty analysis
    prediction_result = predict_emissions_with_uncertainty(
        payload,
        include_explanations=True
    )
    
    # Add stored data for comparison
    prediction_result["stored_predictions"] = {
        "co2_emissions_kg": record.co2_emissions_kg,
        "sox_emissions_kg": record.sox_emissions_kg,
        "nox_emissions_kg": record.nox_emissions_kg,
        "prediction_confidence": record.prediction_confidence,
        "carbon_intensity_kg_per_ton": record.carbon_intensity_kg_per_ton,
        "energy_intensity_kwh_per_ton": record.energy_intensity_kwh_per_ton
    }
    
    return prediction_result


# =====================================================
# Explain SHAP
# =====================================================

@router.get("/{batch_id}/explain")
def explain_process_data(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get SHAP explanations for a batch.
    """
    # Get record and verify project ownership
    record = (
        db.query(ProcessData)
        .join(Project)
        .filter(
            ProcessData.batch_id == batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Process data not found")

    payload = {
        "raw_material_type": record.raw_material_type,
        "material_type": record.material_type,
        "energy_source_type": record.energy_source_type,
        "raw_material_quantity": record.raw_material_quantity,
        "recycled_material_quantity": record.recycled_material_quantity,
        "energy_consumption_kwh": record.energy_consumption_kwh,
        "water_consumption_liters": record.water_consumption_liters,
        "production_volume": record.production_volume,
        "ore_grade": record.ore_grade,
        "waste_slag_quantity": record.waste_slag_quantity,
        "scrap_content_percentage": record.scrap_content_percentage,
        "recycling_rate_percentage": record.recycling_rate_percentage,
    }

    return {
        "batch_id": batch_id,
        "explanation": explain_emissions(payload)
    }


# =====================================================
# List by project
# =====================================================

@router.get("/project/{project_id}", response_model=List[ProcessDataResponse])
def list_process_data_for_project(
    project_id: UUID,
    include_uncertainty: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all process data for a project.
    
    Args:
        project_id: Project identifier
        include_uncertainty: Whether to include uncertainty info
        db: Database session
        current_user: Authenticated user
    """
    # Verify project ownership first
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    records = (
        db.query(ProcessData)
        .filter(ProcessData.project_id == project_id)
        .order_by(ProcessData.created_at.desc())
        .all()
    )

    # Prepare response with optional uncertainty info
    response = []
    for record in records:
        record_dict = record.__dict__
        if include_uncertainty:
            record_dict["uncertainty_info"] = record.uncertainty_data
            record_dict["model_metadata"] = record.model_metadata
        response.append(ProcessDataResponse(**record_dict))

    return response


# =====================================================
# Scenario Analysis
# =====================================================

class ScenarioChange(BaseModel):
    parameter: str
    change: str  # Can be percentage like "20%" or absolute value


class ScenarioAnalysisRequest(BaseModel):
    base_batch_id: str
    scenarios: List[ScenarioChange]


@router.post("/scenario-analysis")
def perform_scenario_analysis(
    request: ScenarioAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform what-if scenario analysis on existing batch data.
    """
    # Get base record
    base_record = (
        db.query(ProcessData)
        .join(Project)
        .filter(
            ProcessData.batch_id == request.base_batch_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if not base_record:
        raise HTTPException(status_code=404, detail="Base batch not found")

    # Prepare base payload
    base_payload = {
        "raw_material_type": base_record.raw_material_type,
        "material_type": base_record.material_type,
        "energy_source_type": base_record.energy_source_type,
        "raw_material_quantity": base_record.raw_material_quantity,
        "recycled_material_quantity": base_record.recycled_material_quantity,
        "energy_consumption_kwh": base_record.energy_consumption_kwh,
        "water_consumption_liters": base_record.water_consumption_liters,
        "production_volume": base_record.production_volume,
        "ore_grade": base_record.ore_grade,
        "waste_slag_quantity": base_record.waste_slag_quantity,
        "scrap_content_percentage": base_record.scrap_content_percentage,
        "recycling_rate_percentage": base_record.recycling_rate_percentage,
    }

    # Convert scenarios to dict format
    scenario_changes = {}
    for scenario in request.scenarios:
        scenario_changes[scenario.parameter] = scenario.change

    # Perform scenario analysis
    from app.ml.predict import analyze_scenario
    try:
        result = analyze_scenario(base_payload, scenario_changes)
        result["base_batch_id"] = request.base_batch_id
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scenario analysis failed: {str(e)}")


# =====================================================
# Prediction endpoint (without saving)
# =====================================================

@router.post("/predict")
def predict_emissions_endpoint(
    payload: ProcessDataCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Predict emissions without saving to database.
    Useful for what-if analysis and testing.
    """
    try:
        result = predict_emissions_with_uncertainty(
            payload.model_dump(),
            include_explanations=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


# =====================================================
# Get model performance info
# =====================================================

@router.get("/model/info")
def get_model_info():
    """
    Get ML model performance and metadata.
    """
    from app.ml.predict import get_model_performance
    try:
        return get_model_performance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")