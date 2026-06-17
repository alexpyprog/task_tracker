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

    allow_origins: list[str] = ["*"]
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    frontend_url = os.getenv("FRONTEND_URL")
    backend_url = os.getenv("BACKEND_URL")

    db_name = os.getenv("DB_NAME")
    db_url = (
        f"postgresql+asyncpg://"
        f"{os.getenv('DB_USER')}:"
        f"{os.getenv('DB_PASS')}@"
        f"{os.getenv('DB_HOST')}:"
        f"{os.getenv('DB_PORT', 5432)}/"
        f"{os.getenv('DB_NAME')}"
    )
    sync_db_url = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:"
        f"{os.getenv('DB_PASS')}@"
        f"localhost:"
        f"{os.getenv('DB_PORT', 5432)}/"
        f"{os.getenv('DB_NAME')}"
    )
    DB_PASSWORD = os.getenv("DB_PASS")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_USER = os.getenv("DB_USER")
    DB_NAME = os.getenv("DB_NAME")

    LOG_ROTATE_DAYS: int = 30

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@tasktracker.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "TaskTracker")

    invitation_per_user_limit: int = 5
    invitation_cooldown_hours: int = 24
    invitation_exp_days: int = 7


settings = Settings()
