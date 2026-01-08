import ast
import json
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# определяем базовую директорию проекта
BASE_DIR = Path(__file__).resolve().parent.parent.parent

if os.path.exists(os.path.join(BASE_DIR, ".env.local")):
    load_dotenv(os.path.join(BASE_DIR, ".env.local"))
else:
    load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings:

    private_key = os.path.join(BASE_DIR, 'app', 'core', 'security', 'jwt_private.pem')
    public_key = os.path.join(BASE_DIR, 'app', 'core', 'security', 'jwt_public.pem')

    algorithm = 'RS256'

    access_token_expire = timedelta(minutes=30)
    refresh_token_expire = timedelta(days=30)

    allow_origins: list[str] = json.loads(os.getenv("ALLOWED_ORIGINS", "[]"))
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
