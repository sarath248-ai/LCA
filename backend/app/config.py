import os
from dotenv import load_dotenv

load_dotenv()

# FIXED: Use environment variable with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ecometal_user:ecometal123@localhost:5432/ecometal_lca"
)

SECRET_KEY = "ecometal_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ==============================
# OpenRouter (AI Chatbot)
# ==============================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")

# Validate required environment variables
if not OPENROUTER_API_KEY:
    import warnings
    warnings.warn("OPENROUTER_API_KEY not set. AI chat features will not work.")