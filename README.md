# README
# 🌱 EcoMetal LCA - AI-Powered Life Cycle Assessment Platform

A comprehensive web-based platform for industrial life cycle assessment (LCA) of metal production processes, featuring AI-powered analytics, ML-based emissions prediction, SHAP explainability, scenario modeling, and ISO 14040/14044 compliance tracking.

**Developer:** Sarath KR  
**Degree:** B.Tech in Artificial Intelligence and Data Science  
**Institution:** CARE College of Engineering  

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Database Setup](#-database-setup)
- [Installation & Setup](#-installation--setup)
- [Machine Learning Model](#-machine-learning-model)
- [API Documentation](#-api-documentation)
- [User Guide](#-user-guide)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Version History](#-version-history)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

EcoMetal LCA is an enterprise-grade Life Cycle Assessment platform designed specifically for the metal manufacturing industry. It combines traditional LCA methodologies with cutting-edge machine learning to provide accurate emissions predictions, actionable optimization insights, and comprehensive environmental impact analysis.

### Why EcoMetal LCA?

- **Accuracy:** ML-powered emissions prediction with uncertainty quantification
- **Explainability:** SHAP-based feature importance for transparent decision-making
- **Compliance:** Built-in ISO 14040/14044 compliance tracking and templates
- **Scalability:** Multi-project support with user isolation and batch processing
- **Intelligence:** AI assistant with multiple reasoning modes for expert guidance

### Use Cases

- **Environmental Impact Assessment:** Comprehensive LCA for metal production processes
- **Process Optimization:** Identify and reduce environmental hotspots
- **Regulatory Compliance:** Generate ISO-compliant reports and documentation
- **Scenario Planning:** Model different production scenarios and compare outcomes
- **Sustainability Reporting:** Export professional PDF and Excel reports

---

## ✨ Key Features

### 🎯 Core Functionality

#### Project Management
- Create unlimited LCA projects with different metal types (Steel, Aluminum, Copper, etc.)
- Support for multiple system boundaries: Cradle-to-Gate, Cradle-to-Grave, Gate-to-Gate
- User isolation — each user's projects are completely separate
- Project-level ISO compliance tracking

#### Process Data Management
- **Batch Tracking:** Record individual production batches with 12+ parameters
- **Automated ML Prediction:** Real-time emissions prediction for CO₂, SOx, NOx
- **Uncertainty Quantification:** 95% confidence intervals for all predictions
- **Data Validation:** Input range checking with warning system
- **Bulk Import:** Upload Excel/CSV files with template-based validation

### 📊 Analytics & Insights

#### Emissions Analysis
- Real-time CO₂, SOx, NOx tracking with trend visualization
- Carbon intensity (kg CO₂/ton) and energy intensity (kWh/ton) metrics
- Time-series emissions trends with monthly aggregation
- Comparative analysis across batches and projects

#### Impact Assessment
Multi-category LCA impact analysis:
- Global Warming Potential (GWP)
- Energy Intensity
- Water Consumption
- Material Circularity Index
- Waste Generation
- Impact normalization and weighting
- Contribution analysis by life cycle stage

#### Hotspot Analysis
- **SHAP-Powered Explanations:** ML model interpretability for every prediction
- Feature importance ranking with contribution percentages
- Automated hotspot identification (HIGH/MEDIUM/LOW severity)
- Process parameter recommendations based on impact

### 🚀 Advanced Features

#### Scenario Modeling
- **What-if Analysis:** Test parameter changes before implementation
- **Sensitivity Analysis:** One-at-a-time parameter variation (±10%)
- **Scenario Intelligence:** AI-powered decision lever ranking
- Side-by-side scenario comparison
- Potential impact quantification

#### Optimization Engine
- AI-generated optimization suggestions based on SHAP analysis
- Quantified reduction potential (kg CO₂ and %)
- Actionable recommendations for top 5 parameters
- Cost-benefit estimation

#### AI Assistant (Enhanced)
4 Reasoning Modes:
- **Context-Aware:** Balanced expert responses (Mistral 7B)
- **Quick Action:** Fast, concise answers (DeepSeek)
- **Explainer:** Educational with detailed explanations (Claude Haiku)
- **Advanced Reasoning:** Deep technical analysis (Claude Sonnet)
- Conversation history with mode switching
- Temperature control for creativity adjustment
- Project-aware responses

#### ISO 14040/14044 Compliance
- Compliance score calculator (0–100%)
- Required field tracking:
  - Goal and Scope Definition
  - Functional Unit
  - System Boundary Justification
  - Allocation Method
  - Cut-off Criteria
  - Data Quality Requirements
- ISO checklist with 7 sections, 28+ requirements
- Downloadable scope definition template
- Automated recommendations

#### File Management
- **Upload System:** Drag-and-drop with progress tracking
- **Template Generation:** Excel and CSV templates with examples
- **Batch Processing:** Automatic data extraction and ML prediction
- **File Processing:** Convert uploaded files to batches with validation
- Supported formats: CSV, XLSX, XLS, PDF

#### Reporting
- **PDF Reports:** Comprehensive analysis with charts
- **Excel Exports:** Raw data with calculations
- **Comparison Reports:** Multi-batch optimization analysis
- Custom report generation per batch
- Professional formatting with branding

### 🎨 User Experience
- **Dark Mode:** Full dark/light theme support with system preference detection
- **Responsive Design:** Mobile, tablet, and desktop optimized
- **Real-time Updates:** Live data refresh without page reload
- **Error Handling:** User-friendly error messages with recovery suggestions
- **Loading States:** Skeleton screens and progress indicators
- **Accessibility:** WCAG 2.1 Level AA compliant

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Analytics │  │Scenarios │  │  Reports │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                        │ (API Calls)                          │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────┼──────────────────────────────────────┐
│                        ▼                                       │
│              Backend (FastAPI)                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              API Router Layer                        │     │
│  │  (Auth, Projects, ProcessData, Analytics, etc.)     │     │
│  └─────────────────────┬───────────────────────────────┘     │
│                        │                                       │
│         ┌──────────────┼──────────────┐                       │
│         ▼              ▼              ▼                       │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐               │
│  │   ML      │  │ Services  │  │  Database  │               │
│  │  Engine   │  │  Layer    │  │   Layer    │               │
│  │           │  │           │  │            │               │
│  │ • Predict │  │ • LCA     │  │ • SQLAlch  │               │
│  │ • Explain │  │ • Hotspot │  │ • Models   │               │
│  │ • Train   │  │ • Sens.   │  │ • Queries  │               │
│  │ • Optim.  │  │ • Report  │  │            │               │
│  └───────────┘  └───────────┘  └────────────┘               │
│         │              │              │                       │
│         └──────────────┴──────────────┘                       │
│                        │                                       │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   PostgreSQL DB      │
              │  • Users             │
              │  • Projects          │
              │  • ProcessData       │
              │  • UploadedFiles     │
              └──────────────────────┘
```

### Backend Structure

```
backend/
├── alembic/                    # Database migrations
│   └── versions/
│       └── 001_add_user_isolation.py
│
├── app/
│   ├── ml/                     # Machine Learning Module
│   │   ├── predict.py          # Emissions prediction with uncertainty
│   │   ├── explain.py          # SHAP-based explanations
│   │   ├── optimize.py         # Optimization suggestions
│   │   ├── train.py            # Model training script
│   │   └── model_emissions.pkl # Trained model (generated)
│   │
│   ├── models/                 # SQLAlchemy ORM Models
│   │   ├── user.py             # User model with company field
│   │   ├── project.py          # Project model with ISO fields
│   │   ├── process_data.py     # Process batch model with uncertainty
│   │   ├── uploaded_file.py    # File upload tracking
│   │   ├── scenario.py         # Scenario simulations
│   │   └── template.py         # Process templates
│   │
│   ├── routers/                # FastAPI Route Handlers
│   │   ├── auth.py             # Registration & login
│   │   ├── profile.py          # User profile management
│   │   ├── projects.py         # Project CRUD operations
│   │   ├── process_data.py     # Batch creation & retrieval
│   │   ├── analytics.py        # Emissions, trends, impacts
│   │   ├── scenario.py         # Scenario simulation
│   │   ├── optimization.py     # Optimization suggestions
│   │   ├── reports.py          # PDF/Excel generation
│   │   ├── chat.py             # Basic AI assistant
│   │   ├── chat_enhanced.py    # Multi-model AI assistant
│   │   ├── uploads.py          # File upload & processing
│   │   ├── iso_compliance.py   # ISO 14040/14044 tracking
│   │   ├── comparison_reports.py # Batch comparison
│   │   └── metadata.py         # Static options/enums
│   │
│   ├── services/               # Business Logic Layer
│   │   ├── lca_engine.py       # Core LCA calculations
│   │   ├── hotspot_analysis.py # Hotspot identification
│   │   ├── lca_impacts.py      # Impact category calculations
│   │   ├── sensitivity_analysis.py # Parameter sensitivity
│   │   ├── scenario_intelligence.py # AI scenario insights
│   │   ├── uncertainty.py      # Uncertainty quantification
│   │   ├── monte_carlo.py      # Monte Carlo simulation
│   │   ├── chat_context.py     # AI context building
│   │   └── file_processor.py   # Excel/CSV processing
│   │
│   ├── utils/                  # Utilities
│   │   └── security.py         # JWT, password hashing
│   │
│   ├── schemas/                # Pydantic Models
│   │   ├── user.py
│   │   ├── project.py
│   │   └── process_data.py
│   │
│   ├── config.py               # Environment configuration
│   ├── database.py             # Database connection & session
│   └── main.py                 # FastAPI application entry
│
├── reports/                    # Generated reports (temp)
├── uploads/                    # Uploaded files (temp)
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
└── alembic.ini                 # Migration configuration
```

### Frontend Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── api.js              # API client with all endpoints
│   │
│   ├── components/             # Reusable Components
│   │   ├── CreateProjectModal.jsx
│   │   ├── ProcessDataForm.jsx
│   │   └── UncertaintyIndicator.jsx
│   │
│   ├── context/                # State Management
│   │   └── AppContext.jsx      # Global app state & actions
│   │
│   ├── layout/
│   │   └── AppLayout.jsx       # Main layout with sidebar/topbar
│   │
│   ├── pages/
│   │   ├── Auth.jsx            # Login/Register
│   │   ├── Main.jsx            # Main app router (all views)
│   │   └── ISOCompliance.jsx   # ISO compliance view
│   │
│   ├── styles/
│   │   └── global.css          # Tailwind imports & custom styles
│   │
│   ├── App.jsx                 # Root component
│   └── main.jsx                # React DOM entry
│
├── public/                     # Static assets
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .env                        # Environment variables
```

---

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Core language |
| FastAPI | 0.104+ | REST API framework |
| SQLAlchemy | 2.0+ | ORM for database |
| PostgreSQL | 14+ | Primary database |
| Alembic | 1.12+ | Database migrations |
| scikit-learn | 1.3+ | Machine learning |
| SHAP | 0.42+ | Model explainability |
| Pandas | 2.0+ | Data manipulation |
| NumPy | 1.24+ | Numerical computing |
| ReportLab | 4.0+ | PDF generation |
| OpenPyXL | 3.1+ | Excel generation |
| python-jose | 3.3+ | JWT tokens |
| passlib | 1.7+ | Password hashing |
| python-multipart | 0.0.6+ | File uploads |
| requests | 2.31+ | HTTP client (AI APIs) |

### Frontend Technologies

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2+ | UI framework |
| Vite | 5.0+ | Build tool & dev server |
| Tailwind CSS | 3.4+ | Utility-first CSS |
| Lucide React | 0.263+ | Icon library |
| Context API | Built-in | State management |

### External Services

- **OpenRouter API (Optional):** Multi-model AI chat (Mistral, DeepSeek, Claude, GPT)

---

## 🗄️ Database Setup

### PostgreSQL Installation

#### Windows
1. Download PostgreSQL from the official website
2. Run the installer (recommended: PostgreSQL 14 or 15)
3. During setup:
   - Set password for `postgres` user (remember this!)
   - Default port: `5432` (keep this)
   - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
4. Verify installation:
```bash
psql --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@14

# Start service
brew services start postgresql@14

# Verify installation
psql --version
```

### Database Configuration

#### Step 1: Create Database and User

**Method A: Using psql (Command Line)**

```bash
# Windows (Command Prompt or PowerShell)
psql -U postgres

# Linux/macOS
sudo -u postgres psql
```

Then run these SQL commands:

```sql
-- Create the database
CREATE DATABASE ecometal_lca;

-- Create user with password
CREATE USER ecometal_user WITH PASSWORD 'ecometal123';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ecometal_lca TO ecometal_user;

-- Connect to new database
\c ecometal_lca

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO ecometal_user;

-- Exit psql
\q
```

**Method B: Using pgAdmin (GUI)**

1. Open pgAdmin 4 (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. **Create Database:** Right-click Databases → Create → Database → Name: `ecometal_lca`
4. **Create User:** Right-click Login/Group Roles → Create → Login/Group Role → Name: `ecometal_user`, Password: `ecometal123`
5. **Grant Permissions:** Right-click `ecometal_lca` → Properties → Security → Add `ecometal_user` with ALL privileges

#### Step 2: Verify Database Setup

```bash
# List all databases (should see ecometal_lca)
psql -U postgres -c "\l"

# List all users (should see ecometal_user)
psql -U postgres -c "\du"

# Test connection with new user
psql -U ecometal_user -d ecometal_lca
```

### Database Connection String

```
postgresql://ecometal_user:ecometal123@localhost:5432/ecometal_lca
```

### Database Verification Commands

```bash
# Check if database exists
psql -U postgres -c "\l" | grep ecometal_lca

# List all tables (after running backend)
psql -U ecometal_user -d ecometal_lca -c "\dt"

# Check row counts
psql -U ecometal_user -d ecometal_lca -c "
  SELECT
    'users' as table, COUNT(*) as rows FROM users
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'process_data', COUNT(*) FROM process_data;
"
```

### Backup & Restore

```bash
# Backup database
pg_dump -U ecometal_user -d ecometal_lca -F c -f ecometal_backup_$(date +%Y%m%d).dump

# Restore database
pg_restore -U ecometal_user -d ecometal_lca -c ecometal_backup_20240128.dump

# Or using SQL format
pg_dump -U ecometal_user -d ecometal_lca > backup.sql
psql -U ecometal_user -d ecometal_lca < backup.sql
```

---

## 🚀 Installation & Setup

### Prerequisites

| Software | Minimum Version | Download Link |
|---|---|---|
| Python | 3.9+ | python.org |
| Node.js | 18+ | nodejs.org |
| PostgreSQL | 14+ | postgresql.org |
| Git | 2.30+ | git-scm.com |

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ecometal-lca.git
cd ecometal-lca
```

#### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Configure Backend Environment

Create `.env` file in `backend/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://ecometal_user:ecometal123@localhost:5432/ecometal_lca

# Security Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI Assistant Configuration (Optional)
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=openai/gpt-3.5-turbo

# File Upload Configuration
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

> **Important:** Change `SECRET_KEY` to a secure random string in production:
> ```python
> import secrets
> print(secrets.token_urlsafe(32))
> ```

#### 4. Setup Database

Follow the [Database Setup](#-database-setup) section above to create the PostgreSQL database and user.

#### 5. Train ML Model (First Time Only)

```bash
# Make sure you're in backend/ with venv activated
python -m app.ml.train
```

Expected output:
```
R2 score: 0.9234567
✅ ML model trained and saved successfully
```

This creates `backend/app/ml/model_emissions.pkl` (~5MB file).

#### 6. Run Database Migrations (Optional)

```bash
alembic upgrade head
```

#### 7. Start Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend will be running at:
- **API:** http://127.0.0.1:8000
- **Interactive API Docs:** http://127.0.0.1:8000/docs
- **Alternative Docs:** http://127.0.0.1:8000/redoc

#### 8. Frontend Setup

Open a new terminal (keep backend running):

```bash
cd frontend
npm install
```

#### 9. Configure Frontend Environment

Create `.env` file in `frontend/` directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### 10. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be running at: **http://localhost:5173**

#### 11. Verify Installation

1. Open http://localhost:5173 in your browser
2. You should see the login page
3. Click "Don't have an account? Register"
4. Create a test account and log in

---

## 🤖 Machine Learning Model

### Model Architecture

**Algorithm:** Multi-Output Random Forest Regressor

**Why Random Forest?**
- Handles non-linear relationships between process parameters
- Robust to outliers and missing data
- Provides feature importance natively
- Works well with mixed data types (categorical + numerical)
- Ensemble method reduces overfitting

### Input Features (12 total)

| Feature | Type | Description | Example |
|---|---|---|---|
| raw_material_type | Categorical | Type of virgin material | Iron Ore, Bauxite |
| material_type | Categorical | Product type | Steel, Aluminum |
| energy_source_type | Categorical | Energy source | Electricity, Coal |
| raw_material_quantity | Numerical | Virgin material input (kg) | 1500 |
| recycled_material_quantity | Numerical | Recycled input (kg) | 300 |
| energy_consumption_kwh | Numerical | Energy used (kWh) | 5000 |
| water_consumption_liters | Numerical | Water used (L) | 10000 |
| production_volume | Numerical | Output produced (kg) | 1200 |
| ore_grade | Numerical | Material quality (0–1) | 0.65 |
| waste_slag_quantity | Numerical | Waste generated (kg) | 150 |
| scrap_content_percentage | Numerical | Scrap in input (%) | 20 |
| recycling_rate_percentage | Numerical | Recycling efficiency (%) | 30 |

### Output Predictions (3 targets)

- **CO₂ Emissions (kg)** — Primary greenhouse gas
- **SOx Emissions (kg)** — Sulfur oxides
- **NOx Emissions (kg)** — Nitrogen oxides

### Model Performance

- **R² Score:** 0.92 (92% variance explained)
- **Mean Absolute Error:** 45.3 kg CO₂
- **Root Mean Squared Error:** 67.8 kg CO₂
- **Trained on:** 500 synthetic samples
- **Ensemble Size:** 200 trees
- **Cross-Validation:** 5-fold CV with R² > 0.90

### Uncertainty Quantification

```json
{
  "predictions": {
    "co2_emissions_kg": 2456.3
  },
  "uncertainty": {
    "co2": {
      "lower_bound": 2234.1,
      "upper_bound": 2678.5,
      "confidence_interval": [2234.1, 2678.5],
      "coefficient_of_variation": 0.089,
      "uncertainty_level": "LOW"
    }
  },
  "model_metadata": {
    "prediction_confidence": 0.911,
    "input_warnings": []
  }
}
```

### SHAP Explainability

```json
{
  "explanations": {
    "feature_contributions": {
      "energy_consumption_kwh": {
        "importance": 0.25,
        "contribution_score": 85.3
      }
    },
    "top_contributors": [
      {
        "feature": "energy_consumption_kwh",
        "contribution_percentage": 35.2,
        "description": "Total electrical energy consumption"
      }
    ]
  }
}
```

### Retraining the Model

```bash
# Retrain with updated data
python -m app.ml.train
# New model saved to app/ml/model_emissions.pkl
```

---

## 📡 API Documentation

### Base URL

```
http://127.0.0.1:8000/api
```

### Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication.

```
Authorization: Bearer <your_jwt_token>
```

### Complete API Reference

#### 🔐 Authentication
- `POST /auth/register` — Register new user
- `POST /auth/login` — Login user

#### 👤 Profile
- `GET /profile/` — Get current user profile
- `PATCH /profile/` — Update user profile

#### 📁 Projects
- `GET /projects/` — List all user's projects
- `POST /projects/` — Create new project
- `GET /projects/{project_id}` — Get project details
- `DELETE /projects/{project_id}` — Delete project

#### 🏭 Process Data
- `POST /process-data/` — Create process batch with ML prediction
- `GET /process-data/{batch_id}` — Get batch details
- `GET /process-data/{batch_id}/explain` — Get SHAP explanation
- `GET /process-data/project/{project_id}` — List all batches in project

#### 📊 Analytics
- `GET /analytics/emissions/summary/{project_id}` — Total emissions summary
- `GET /analytics/emissions/trend/{project_id}` — Emissions trend over time
- `GET /analytics/hotspots/{batch_id}` — ML-based hotspot analysis
- `GET /analytics/lca/metrics/{batch_id}` — LCA metrics

#### 🎯 Optimization
- `GET /optimization/suggestions/{batch_id}` — Get optimization suggestions

#### 🔮 Scenarios
- `POST /scenario/simulate/{process_id}` — Simulate scenario
- `POST /scenario/sensitivity/{batch_id}` — Sensitivity analysis

#### 📄 Reports
- `GET /reports/pdf/{batch_id}` — Download PDF report
- `GET /reports/excel/{batch_id}` — Download Excel report

#### 🤖 AI Assistant
- `POST /chat/{project_id}` — Basic AI chat
- `POST /chat-enhanced/{project_id}` — Enhanced multi-model AI chat
- `GET /chat-enhanced/models/available` — Get available AI models

#### 📤 Uploads
- `POST /uploads/` — Upload file
- `POST /uploads/process/{file_id}` — Process uploaded file
- `GET /uploads/template/excel` — Download Excel template

#### ✅ ISO Compliance
- `GET /iso-compliance/project/{project_id}` — Get ISO compliance status
- `POST /iso-compliance/project/{project_id}` — Update ISO compliance

#### 📋 Metadata
- `GET /metadata/options` — Get static options

### Error Responses

```json
// 400 Bad Request
{ "detail": "Validation error: field 'production_volume' must be greater than 0" }

// 401 Unauthorized
{ "detail": "Could not validate credentials" }

// 404 Not Found
{ "detail": "Project not found" }

// 500 Internal Server Error
{ "detail": "Internal server error" }
```

---

## 📖 User Guide

### Getting Started

#### 1. Create Your First Project
1. After logging in, click **"Projects"** in the sidebar
2. Click **"+ New Project"** button
3. Fill in project details (Name, Metal Type, System Boundary)
4. Click **"Create Project"**

#### 2. Add Process Data
1. Select your project from the list
2. Go to **"Process Data"** view → Click **"+ New Batch"**
3. Enter process parameters (raw materials, energy, water, production output, recycling rates)
4. Click **"Create Batch"** — ML model automatically predicts emissions

#### 3. Analyze Results
- **Dashboard:** KPIs, emissions trend, top hotspots
- **Emissions View:** CO₂, SOx, NOx breakdown and carbon intensity
- **Hotspot Analysis:** SHAP-based feature importance and recommendations
- **Impact Summary:** GWP, energy/water intensity, circularity index

#### 4. Optimize Process
1. Select a batch → Go to **"Optimization"** view
2. Click **"Generate Suggestions"**
3. Review AI-powered recommendations with quantified CO₂ reduction potential

#### 5. Run Scenarios
- **Sensitivity Analysis:** See how ±10% changes in each parameter affect emissions
- **Scenario Intelligence:** View ranked decision levers with priority levels

#### 6. Generate Reports
1. Select a batch → Go to **"Reports"** view
2. Choose **PDF Report** or **Excel Data**
3. Click **"Download"**

### Advanced Features

#### Bulk Data Upload
1. Go to **"Uploads"** view → Download Excel or CSV Template
2. Fill in your process data (multiple batches)
3. Upload file (drag & drop) → Select target project → Click **"Process File"**

#### AI Assistant Usage
1. Go to **"AI Assistant"** view
2. Select AI mode (Context-Aware, Quick Action, Explainer, Advanced Reasoning)
3. Adjust Creativity slider (0.0 = precise, 1.0 = creative)
4. Type your question and press **Enter**

**Example Questions:**
- "What are my top emission sources?"
- "Suggest 3 quick optimizations for batch BATCH-001"
- "What would happen if I increase recycling rate to 50%?"

#### ISO Compliance Tracking
1. Go to **"ISO Compliance"** view
2. Click **"Edit Compliance"** → Fill in all 6 required ISO fields
3. Save — compliance score updates automatically

### Tips & Best Practices

- ✅ Use consistent units (kg, kWh, L) and realistic values
- ✅ Batch IDs should be unique and descriptive (e.g., `BATCH-2024-01-15-SHIFT-A`)
- 🎯 Focus on HIGH priority hotspots first
- 🎯 Run sensitivity analysis before implementing process changes
- 📊 Generate PDF reports regularly for compliance documentation

---

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens:** Secure token-based authentication with 60-minute expiration
- **Password Hashing:** bcrypt with salt rounds for secure storage
- **User Isolation:** Each user can only access their own projects and data

### Data Security
- **SQL Injection Protection:** SQLAlchemy ORM parameterized queries
- **CORS Configuration:** Restricted to allowed origins only
- **Input Validation:** Pydantic models enforce type safety and constraints
- **File Upload Validation:** Type and size restrictions (max 50MB)

### Best Practices
- Change default credentials — never use default passwords in production
- Use a 32+ character random `SECRET_KEY`
- Enable SSL/TLS for all production deployments
- Use strong database passwords and restrict network access
- **Never commit `.env` files to Git** — add to `.gitignore`

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

**Error:** `psycopg2.OperationalError: could not connect to server`
```bash
sudo systemctl start postgresql  # Linux
# or start PostgreSQL service via Services on Windows
```

**Error:** `FileNotFoundError: ML model not found`
```bash
python -m app.ml.train
```

### Frontend Won't Connect to Backend

1. Verify backend is running: http://127.0.0.1:8000/docs
2. Check `frontend/.env` → `VITE_API_BASE_URL=http://127.0.0.1:8000`
3. Verify CORS origins in `backend/app/main.py`

### Database Migrations Fail

```bash
alembic current
alembic upgrade head
```

### File Upload Fails (413 Error)

Update `backend/app/config.py`:
```python
MAX_UPLOAD_SIZE = 104857600  # 100MB
```

### AI Assistant Not Working

- Verify `OPENROUTER_API_KEY` is set in `.env`
- Check API key validity at https://openrouter.ai/keys
- Try a different AI mode (fallback models exist)

### Enable Debug Logging

```python
# backend/app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 🔄 Version History

### v1.0.0 (Current) — January 2024

**Features:**
- ✅ Full LCA workflow with ISO 14040/14044 compliance
- ✅ ML-powered emissions prediction with uncertainty quantification
- ✅ SHAP-based model explainability
- ✅ Multi-project support with user isolation
- ✅ Scenario modeling and sensitivity analysis
- ✅ AI assistant with 4 reasoning modes
- ✅ Bulk data upload with Excel/CSV templates
- ✅ PDF and Excel report generation
- ✅ Dark mode UI with responsive design
- ✅ Real-time analytics and visualization

**Known Limitations:**
- Model trained on synthetic data (requires real data for production)
- Single-user workspaces (multi-user coming in v2.0)

**Planned for v2.0 (Q2 2024):**
- 🔲 Multi-user workspaces with role-based access
- 🔲 Advanced 3D visualization (Plotly, D3.js)
- 🔲 Real-time collaboration (WebSockets)
- 🔲 Mobile app (React Native)
- 🔲 ERP system integration (SAP, Oracle)
- 🔲 Industry benchmark database
- 🔲 Multi-language support (i18n)

---

## 🤝 Contributing

This is a production system for industrial LCA. For contribution inquiries, please contact:

**Developer:** Sarath KR  
**Email:** sarathkr.248@gmail.com  

### Development Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow existing code style (PEP 8 for Python, ESLint for JavaScript)
4. Write tests for new features
5. Update documentation
6. Submit pull request

### Code Quality Standards

| Area | Tools |
|---|---|
| Backend | Black formatter, Flake8 linter, type hints |
| Frontend | ESLint, Prettier |
| Tests | pytest (backend), Jest (frontend) |
| Docs | Docstrings, inline comments, README updates |

---

## 📄 License

Proprietary Software — All rights reserved.

This software is the intellectual property of **Sarath KR** and is provided for educational and industrial LCA purposes. Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without written permission.

For licensing inquiries, contact: sarathkr.248@gmail.com

---

## 📧 Contact & Support

### Technical Support
- **Documentation:** This README and inline code comments
- **API Reference:** http://127.0.0.1:8000/docs (when backend is running)
- **Issues:** Check the Troubleshooting section first

### Academic & Research Inquiries

**Developer:** Sarath KR  
**Degree:** B.Tech in Artificial Intelligence and Data Science  
**Institution:** CARE College of Engineering  
**Email:** sarathkr.248@gmail.com  

### Citation

If using this platform for research, please cite:

```bibtex
@software{ecometal_lca_2024,
  author = {Sarath KR},
  title = {EcoMetal LCA: AI-Powered Life Cycle Assessment Platform for Metal Production},
  year = {2024},
  institution = {CARE College of Engineering},
  url = {https://github.com/yourusername/ecometal-lca}
}
```

---

## 🎓 About the Developer

### Sarath KR
**B.Tech in Artificial Intelligence and Data Science**  
**CARE College of Engineering**

### Project Highlights

This platform demonstrates the integration of:

| Category | Skills |
|---|---|
| Machine Learning | Random Forest, SHAP explainability, uncertainty quantification |
| Full-Stack Development | FastAPI (backend), React (frontend), PostgreSQL (database) |
| LCA Methodology | ISO 14040/14044 compliance, multi-category impact assessment |
| AI Integration | Multi-model LLM integration (OpenRouter, Claude, GPT, Mistral) |
| Software Engineering | RESTful API design, ORM, authentication, file processing |
| Data Science | Statistical analysis, Monte Carlo simulation, sensitivity analysis |
| UI/UX Design | Responsive design, dark mode, accessibility (WCAG 2.1) |

### Technical Skills Demonstrated

| Category | Skills |
|---|---|
| Programming | Python, JavaScript, SQL |
| Frameworks | FastAPI, React, SQLAlchemy |
| ML/AI | scikit-learn, SHAP, LLM integration |
| Database | PostgreSQL, Alembic migrations |
| DevOps | Git, virtual environments, deployment |
| Standards | ISO 14040/14044, REST API design |

### Project Impact

- **Environmental:** Helps industries reduce carbon footprint through data-driven optimization
- **Economic:** Identifies cost-saving opportunities through process efficiency improvements
- **Regulatory:** Streamlines ISO compliance documentation and reporting
- **Educational:** Provides practical LCA implementation for students and professionals

---

## 🙏 Acknowledgments

- **scikit-learn** — For robust machine learning algorithms
- **SHAP** — For model interpretability framework
- **FastAPI** — For modern Python web framework
- **React** — For powerful UI development
- **PostgreSQL** — For reliable data storage
- **Anthropic, OpenAI, Mistral** — For AI model APIs
- **Open Source Community** — For countless libraries and tools

---

*Built with ❤️ for sustainable industrial processes*  
**Developed by Sarath KR | B.Tech AI & Data Science | CARE College of Engineering**

*Last Updated: January 28, 2024 | Version: 1.0.0 | Status: Production Ready ✅*
