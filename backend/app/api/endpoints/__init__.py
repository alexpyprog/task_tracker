import importlib
from pathlib import Path

from fastapi import FastAPI

from app.logger.file_logger import CustomLogger

logger = CustomLogger('Endpoints')


def setup_routers(app: FastAPI):
    """
    Функция регистрации роутеров FastAPI.
    Автоматически импортирует все модули из директории, где находится этот файл.
    """
    routers_dir = Path(__file__).parent

    logger.info(f"Загрузка роутеров из: {routers_dir}")

    for file_path in routers_dir.glob("*.py"):
        if file_path.name.startswith("__"):
            continue

        module_name = file_path.stem

        try:
            module = importlib.import_module(f".{module_name}", package=__package__)

            if hasattr(module, "register_router"):
                module.register_router(app)
                logger.info(f"Успешно зарегистрированы маршруты из: {module_name}")
            else:
                logger.warning(f"Модуль {module_name} не содержит 'register_router()'")

        except Exception as e:
            logger.error(f"Ошибка при загрузке роутера из {module_name}: {e}")