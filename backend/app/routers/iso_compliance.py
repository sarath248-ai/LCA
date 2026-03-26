from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/api/iso-compliance",
    tags=["ISO Compliance"]
)

class ISOComplianceUpdate(BaseModel):
    goal_and_scope: Optional[str] = None
    functional_unit: Optional[str] = None
    system_boundary_justification: Optional[str] = None
    allocation_method: Optional[str] = None
    cutoff_criteria: Optional[str] = None
    data_quality_requirements: Optional[str] = None

class ComplianceCheckResponse(BaseModel):
    score: int
    missing_fields: List[str]
    recommendations: List[str]
    completeness: Dict[str, bool]

def calculate_compliance_score(project: Project) -> Dict:
    """Calculate ISO 14040/14044 compliance score"""
    required_fields = [
        ("goal_and_scope", "Goal and Scope Definition"),
        ("functional_unit", "Functional Unit"),
        ("system_boundary_justification", "System Boundary Justification"),
        ("allocation_method", "Allocation Method"),
        ("cutoff_criteria", "Cut-off Criteria"),
        ("data_quality_requirements", "Data Quality Requirements")
    ]
    
    missing_fields = []
    present_fields = []
    recommendations = []
    
    for field_name, field_label in required_fields:
        value = getattr(project, field_name)
        if not value or (isinstance(value, str) and value.strip() == ""):
            missing_fields.append(field_label)
        else:
            present_fields.append(field_label)
    
    # Calculate score
    total_fields = len(required_fields)
    present_count = len(present_fields)
    score = int((present_count / total_fields) * 100)
    
    # Generate recommendations
    if "Goal and Scope Definition" in missing_fields:
        recommendations.append(
            "Define clear goal and scope according to ISO 14040 Section 5.1"
        )
    if "Functional Unit" in missing_fields:
        recommendations.append(
            "Specify functional unit (e.g., '1 kg of steel product') for comparison"
        )
    if "System Boundary Justification" in missing_fields:
        recommendations.append(
            "Justify system boundary selection (cradle-to-gate, cradle-to-grave)"
        )
    if "Allocation Method" in missing_fields:
        recommendations.append(
            "Document allocation procedures for multi-output processes"
        )
    if "Cut-off Criteria" in missing_fields:
        recommendations.append(
            "Define cut-off criteria (typically 1-5% of mass/energy)"
        )
    if "Data Quality Requirements" in missing_fields:
        recommendations.append(
            "Specify data quality requirements (time-related, geographical, technological coverage)"
        )
    
    # Additional recommendations based on score
    if score >= 75:
        recommendations.append("✓ Good compliance level. Consider peer review for full ISO compliance.")
    elif score >= 50:
        recommendations.append("Improve data quality documentation and allocation methods.")
    else:
        recommendations.append("Critical compliance gaps. Address missing required fields first.")
    
    return {
        "score": score,
        "missing_fields": missing_fields,
        "recommendations": recommendations,
        "completeness": {field: field not in missing_fields for _, field in required_fields},
        "present_fields": present_fields,
        "total_fields": total_fields
    }

@router.get("/project/{project_id}")
def get_iso_compliance(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ISO compliance status for a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    compliance_data = calculate_compliance_score(project)
    
    return {
        "project_id": str(project_id),
        "project_name": project.name,
        **compliance_data
    }

@router.post("/project/{project_id}")
def update_iso_compliance(
    project_id: UUID,
    compliance_data: ISOComplianceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update ISO compliance fields for a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields if provided
    update_data = compliance_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(project, field, value)
    
    # Recalculate compliance score
    compliance_data = calculate_compliance_score(project)
    project.iso_compliance_score = compliance_data["score"]
    project.last_compliance_check = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return {
        "message": "ISO compliance updated successfully",
        "project_id": str(project_id),
        **compliance_data
    }

@router.get("/checklist")
def get_iso_checklist():
    """Get complete ISO 14040/14044 checklist"""
    return {
        "checklist": [
            {
                "section": "Goal and Scope Definition",
                "requirements": [
                    "Intended application clearly stated",
                    "Reasons for carrying out study documented",
                    "Target audience identified",
                    "Comparative assertions disclosed"
                ],
                "iso_reference": "ISO 14040:2006, Section 5.1"
            },
            {
                "section": "Functional Unit",
                "requirements": [
                    "Clearly defined and measurable",
                    "Appropriate for comparison",
                    "Consistent with goal and scope",
                    "Quantified performance characteristic"
                ],
                "iso_reference": "ISO 14040:2006, Section 5.2.2"
            },
            {
                "section": "System Boundary",
                "requirements": [
                    "Unit processes clearly defined",
                    "Cut-off criteria justified",
                    "Allocation procedures documented",
                    "Boundary consistent with goal"
                ],
                "iso_reference": "ISO 14040:2006, Section 5.2.3"
            },
            {
                "section": "Data Quality Requirements",
                "requirements": [
                    "Time-related coverage specified",
                    "Geographical coverage defined",
                    "Technology coverage described",
                    "Precision and completeness documented"
                ],
                "iso_reference": "ISO 14044:2006, Section 4.2.3.6"
            },
            {
                "section": "Life Cycle Inventory",
                "requirements": [
                    "Data collection procedures documented",
                    "Calculations transparent",
                    "Data validation performed",
                    "Uncertainty assessed"
                ],
                "iso_reference": "ISO 14044:2006, Section 4.3"
            },
            {
                "section": "Life Cycle Impact Assessment",
                "requirements": [
                    "Impact categories selected",
                    "Category indicators defined",
                    "Characterization models documented",
                    "Normalization and weighting optional"
                ],
                "iso_reference": "ISO 14044:2006, Section 4.4"
            },
            {
                "section": "Interpretation",
                "requirements": [
                    "Significant issues identified",
                    "Completeness check performed",
                    "Sensitivity analysis conducted",
                    "Conclusions consistent with data"
                ],
                "iso_reference": "ISO 14044:2006, Section 4.5"
            }
        ],
        "total_sections": 7,
        "total_requirements": 28
    }

@router.get("/templates/scope-definition")
def get_scope_definition_template():
    """Get template for scope definition"""
    return {
        "template": """# LCA Goal and Scope Definition Template

## 1. Goal of the Study
- **Intended Application:** [e.g., Internal process optimization, Environmental product declaration]
- **Reasons for Carrying Out Study:** [e.g., Identify environmental hotspots, Compare alternative processes]
- **Target Audience:** [e.g., Internal engineering team, Customers, Regulators]
- **Comparative Assertions:** [Yes/No - If yes, disclose to public]

## 2. Functional Unit
- **Definition:** [e.g., "Production of 1 metric ton of hot-rolled steel coil"]
- **Reference Flow:** [e.g., "1000 kg of steel product at factory gate"]
- **Performance Characteristics:** [e.g., Yield strength: 250 MPa, Thickness: 2 mm]

## 3. System Boundary
- **Approach:** [Cradle-to-gate / Cradle-to-grave / Gate-to-gate]
- **Included Processes:**
  - Raw material extraction and processing
  - Energy production
  - Transportation
  - Manufacturing processes
  - Waste treatment
- **Excluded Processes:** [Justify exclusions]
- **Cut-off Criteria:** [e.g., "Exclude flows contributing <1% of total mass or energy"]

## 4. Allocation Procedures
- **Multi-output Processes:** [Describe allocation method: mass, economic, energy-based]
- **Recycling/Reuse:** [System expansion or cut-off approach]
- **Co-product Handling:** [Allocation or system expansion]

## 5. Data Quality Requirements
- **Time Coverage:** Data should represent [e.g., 2020-2024] technology
- **Geographical Coverage:** [e.g., European Union average]
- **Technology Coverage:** [e.g., Best available technology (BAT)]
- **Precision:** [e.g., ±10% for foreground data, ±20% for background data]
- **Completeness:** [e.g., >95% of material/energy flows included]

## 6. Critical Review (if applicable)
- **Review Type:** [Internal/External]
- **Reviewers:** [Names/Organizations]
- **Review Scope:** [Full study/Partial]

## 7. Limitations
- [List known limitations and assumptions]
""",
        "format": "markdown",
        "recommended_length": "2-3 pages"
    }

@router.get("/template")
def get_scope_template():
    """Get scope definition template"""
    return {
        "template": """# LCA Scope Definition Template - ISO 14040/14044 Compliant

## Project Information
- **Project Name:** [Enter project name]
- **Date:** [YYYY-MM-DD]
- **Prepared By:** [Name/Department]
- **Version:** [1.0]

## 1. Goal Definition
### Primary Goal
[Describe the main purpose of the LCA study]

### Specific Objectives
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

### Intended Applications
- [ ] Internal process improvement
- [ ] Environmental product declaration (EPD)
- [ ] Marketing claims
- [ ] Regulatory compliance
- [ ] Research/Development
- [ ] Other: [Specify]

### Target Audience
- [ ] Internal management
- [ ] Customers
- [ ] Regulators
- [ ] Investors
- [ ] General public

### Comparative Assertions
Will results be used to compare products? [Yes/No]
If Yes, will they be disclosed to public? [Yes/No]

## 2. Scope Definition
### Product System Description
[Describe the product or service being studied]

### Functional Unit
**Definition:** [e.g., "1 kg of manufactured product"]
**Reference Flow:** [e.g., "1000 kg of finished product"]
**Technical Specifications:** [List key performance parameters]

### System Boundary
**Type:** [Cradle-to-grave / Cradle-to-gate / Gate-to-gate / Other]
**Included Life Cycle Stages:**
- [ ] Raw material acquisition
- [ ] Material processing
- [ ] Manufacturing
- [ ] Distribution/Transport
- [ ] Use phase
- [ ] End-of-life treatment
- [ ] Benefits from recycling/reuse

### Cut-off Criteria
**Mass:** [e.g., Exclude flows <1% of total mass]
**Energy:** [e.g., Exclude flows <1% of total energy]
**Environmental Significance:** [Describe criteria for environmentally significant flows]

### Allocation Procedures
**Multi-output Processes:** [Describe method]
**Recycling:** [Describe approach]
**Energy Co-generation:** [Describe allocation]

## 3. Data Requirements
### Data Quality Goals
| Aspect | Requirement |
|--------|-------------|
| Time-related coverage | [e.g., Last 5 years] |
| Geographical coverage | [e.g., European average] |
| Technology coverage | [e.g., BAT, market average] |
| Precision | [e.g., ±10% for foreground data] |
| Completeness | [e.g., >95% of mass/energy] |
| Representatives | [e.g., Specific to process] |

### Data Sources
- Primary data: [Sources]
- Secondary data: [Database, e.g., Ecoinvent, GaBi]
- Assumptions: [List key assumptions]

## 4. Impact Assessment
### Selected Impact Categories
| Category | Indicator | Method |
|----------|-----------|--------|
| Climate Change | kg CO₂-eq | IPCC 2021 |
| Resource Depletion | kg Sb-eq | CML |
| Water Use | m³ | AWARE |
| [Add more] | | |

### Interpretation Parameters
**Significance Threshold:** [e.g., >80% contribution]
**Data Quality Assessment:** [Method]
**Uncertainty Analysis:** [Method]

## 5. Reporting
### Report Content
- [ ] Executive summary
- [ ] Methodology description
- [ ] Data documentation
- [ ] Results presentation
- [ ] Sensitivity analysis
- [ ] Conclusions and limitations

### Critical Review
**Required:** [Yes/No]
**Type:** [Internal panel / External expert / Stakeholder panel]
**Scope:** [Full study / Partial]

## 6. Limitations
[Describe known limitations and their potential impact on results]

## 7. Revision History
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| [Date] | 1.0 | Initial version | [Name] |
""",
        "format": "markdown",
        "description": "Comprehensive ISO-compliant scope definition template",
        "file_name_suggestion": "lca_scope_definition_template.md",
        "last_updated": "2024-01-01"
    }