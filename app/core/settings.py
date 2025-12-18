import ast
import os
from pathlib import Path

from dotenv import load_dotenv

# определяем базовую директорию проекта
BASE_DIR = Path(__file__).resolve().parent.parent.parent

if os.path.exists(os.path.join(BASE_DIR, ".env.local")):
    load_dotenv(os.path.join(BASE_DIR, ".env.local"))
else:
    load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings:
    # google_credentials = (BASE_DIR / os.getenv("GOOGLE_CREDENTIALS_JSON")).resolve()
    # sheet_id = os.getenv("SHEET_ID")

    allow_origins: list[str] = ast.literal_eval(os.getenv("ALLOWED_ORIGINS"))
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    db_name = os.getenv("DB_NAME")
    db_url = (
        f"postgresql+asyncpg://"
        f"{os.getenv('DB_USER')}:"
        f"{os.getenv('DB_PASS')}@"
        f"{os.getenv('DB_HOST')}:"
        f"{os.getenv('DB_PORT', 5432)}/"
        f"{os.getenv('DB_NAME')}"
    )
    DB_PASSWORD = os.getenv("DB_PASS")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_USER = os.getenv("DB_USER")
    DB_NAME = os.getenv("DB_NAME")

    LOG_ROTATE_DAYS: int = 30


settings = Settings()
