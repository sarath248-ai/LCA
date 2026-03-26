from fastapi import FastAPI
from app.database import engine, Base
from app.models import user

from app.routers import auth, process_data, analytics, scenario, optimization, reports
from app.routers import profile
from fastapi.middleware.cors import CORSMiddleware
from app.routers import comparison_reports
from app.routers import projects 
from app.routers import chat
from app.routers import chat_enhanced
from app.routers import uploads
from app.routers import iso_compliance
from app.routers import metadata  # ADDED

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoMetal LCA API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(process_data.router)
app.include_router(analytics.router)
app.include_router(scenario.router)
app.include_router(optimization.router)
app.include_router(reports.router)
app.include_router(comparison_reports.router)
app.include_router(projects.router)
app.include_router(chat.router)
app.include_router(chat_enhanced.router)
app.include_router(uploads.router)
app.include_router(iso_compliance.router)
app.include_router(metadata.router)  # ADDED

@app.get("/")
def root():
    return {"status": "EcoMetal LCA Backend Running"}