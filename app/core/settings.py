from pathlib import Path

from pydantic import ConfigDict
from pydantic import Field
from pydantic_settings import BaseSettings

# определяем базовую директорию проекта
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # поднимаемся до корня migration_project


class Settings(BaseSettings):
    data_dir_name: str = Field(
        default="data",
        description="Имя каталога для хранения JSON",
    )
    default_migration_sleep_minutes: float = Field(
        default=round(1 / 30, 2),
        description="Симуляция миграции в минутах",
    )
    allow_origins: list[str] = Field(default_factory=lambda: ["*"])
    allow_methods: list[str] = Field(default_factory=lambda: ["*"])
    allow_headers: list[str] = Field(default_factory=lambda: ["*"])

    model_config = ConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # переменные из .env подхватываются независимо от регистра
    )

    @property
    def data_dir(self) -> Path:
        # создаём абсолютный путь относительно корня проекта
        path = BASE_DIR / self.data_dir_name
        Path(path).mkdir(parents=True, exist_ok=True)  # создаём каталог, если его нет
        return Path(path)


settings = Settings()
