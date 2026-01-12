# Task Tracker API

Асинхронный таск-трекер на **FastAPI** с полной системой аутентификации JWT, управлением правами доступа и организационной структурой.

## 🚀 Технологии

- **Python 3.11+**
- **FastAPI** - современный веб-фреймворк
- **SQLAlchemy 2.0** (асинхронный)
- **PostgreSQL** / **SQLite** (для тестов)
- **JWT** (RSA ключи) для аутентификации
- **Pydantic v2** - валидация данных
- **bcrypt** - хеширование паролей
- **pytest** / **pytest-asyncio** - тестирование
- **Docker** / **Docker Compose** - контейнеризация
- **factory-boy** - создание тестовых данных

## 📦 Установка

### 1. Клонировать репозиторий
```bash
git clone <ваш-репозиторий>
cd task_tracker
```

### 2. Создать виртуальное окружение
```bash
python -m venv .venv

# Linux/Mac
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 3. Установить зависимости
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt  # для разработки
```

### 4. Настройка окружения
Создать файл `.env`:
```env
# База данных
DATABASE_URL=postgresql+asyncpg://user:password@localhost/task_tracker
TEST_DATABASE_URL=sqlite+aiosqlite:///test.db

# JWT ключи (сгенерировать через generate_keys.py)
PRIVATE_KEY_PATH=private_key.pem
PUBLIC_KEY_PATH=public_key.pem
ALGORITHM=RS256

# Настройки токенов
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Настройки приложения
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
```

### 5. Генерация JWT ключей
```bash
python generate_keys.py
```

### 6. Инициализация базы данных
```bash
# Создать таблицы
python -c "from app.db.base import init_db; import asyncio; asyncio.run(init_db())"
```

## 🏃 Запуск приложения

### Локально (с авторелоадом)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Приложение будет доступно:
- **API**: `http://localhost:8000`
- **Документация Swagger**: `http://localhost:8000/docs`
- **Альтернативная документация**: `http://localhost:8000/redoc`

### Через Docker
```bash
# Сборка и запуск
docker-compose up --build

# Только сборка
docker-compose build

# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f api
```

## 🧪 Тестирование

### Запуск тестов
```bash
# Все тесты с покрытием
pytest --cov=app --cov-report=term-missing

# Только fast тесты
pytest -m "not slow"

# Конкретный файл тестов
pytest tests/test_auth_api.py -v

# С HTML отчетом
pytest --cov=app --cov-report=html
```

### Тестирование через Makefile
```bash
make test          # Запустить все тесты
make test-html     # Создать HTML отчет
make test-fast     # Быстрые тесты
make clean         # Очистить кэш
```

## 🔐 Аутентификация

### Регистрация пользователя
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword123",
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+79991234567"
  }'
```

### Логин
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword123"
  }'
```

### Использование токена
```bash
# Добавить в заголовки
Authorization: Bearer <ваш_jwt_токен>
```

## 📡 API Endpoints

### 🔐 Аутентификация (`/auth`)
- `POST /auth/register` - Регистрация нового пользователя
- `POST /auth/login` - Вход в систему (получение JWT)
- `POST /auth/refresh` - Обновление access токена
- `GET /auth/me` - Информация о текущем пользователе

### 📋 Задачи (`/tasks`)
- `POST /tasks/` - Создать новую задачу
- `GET /tasks/{task_id}` - Получить задачу по ID
- `PUT /tasks/{task_id}` - Обновить задачу
- `DELETE /tasks/{task_id}` - Удалить задачу
- `GET /tasks/my-tasks` - Мои задачи (исполнитель)
- `GET /tasks/created-by-me` - Задачи, созданные мной
- `PATCH /tasks/{task_id}/status` - Изменить статус задачи
- `POST /tasks/{task_id}/assign` - Назначить задачу другому
- `GET /tasks/search` - Поиск задач
- `GET /tasks/overdue` - Просроченные задачи

### 👥 Пользователи (`/users`)
- `GET /users/me` - Информация о текущем пользователе
- `PUT /users/me` - Обновить профиль
- `GET /users/{user_id}` - Информация о пользователе
- `GET /users/search` - Поиск пользователей
- `POST /users/me/change-password` - Смена пароля

### 🛡️ Права доступа (`/tasks/{task_id}/permissions`)
- `POST /tasks/{task_id}/permissions` - Выдать право
- `DELETE /tasks/{task_id}/permissions` - Отозвать право
- `GET /tasks/{task_id}/permissions/{user_id}` - Права пользователя
- `POST /tasks/{task_id}/permissions-set/{user_id}` - Выдать набор прав

### 🏢 Организационная структура
- `POST /organizations/` - Создать организацию
- `POST /groups/` - Создать группу
- `GET /organizations/{org_id}/users` - Пользователи организации

## 🗄️ Модели данных

### Пользователь (User)
```python
username: str (уникальный)
full_name: str
email: str
phone: str
hashed_password: bytes
verified: bool = False
user_status: UserStatus (base_user, manager, admin)
organization_id: int  # Внешний ключ
group_id: int         # Внешний ключ
```

### Задача (Task)
```python
id: UUID (строка)
title: str
description: str
deadline: datetime
created_by: int        # Внешний ключ (User)
worker_id: int         # Внешний ключ (User)
status: TaskStatus (created, in_progress, completed, cancelled)
```

### Права доступа (TaskPermissionModel)
```python
task_id: str           # Внешний ключ
user_id: int           # Внешний ключ
permission: TaskPermission (view, edit, delete, assign, change_status, ...)
```

## 🔧 Права доступа

### Наборы прав:
- **FULL** - Все права (создатель задачи)
- **BASIC** - Базовые права (исполнитель)
- **VIEWER** - Только просмотр
- **EDITOR** - Редактирование без управления правами
- **MANAGER** - Права руководителя
- **QA** - Права тестировщика
- **CLIENT** - Права клиента

### Автоматическая выдача прав:
1. При создании задачи:
   - **Создатель** получает FULL права
   - **Исполнитель** получает BASIC права

2. Права проверяются в каждом защищенном эндпоинте

## 🏗️ Структура проекта

```
task_tracker/
├── app/
│   ├── api/
│   │   └── endpoints/
│   │       ├── auth.py          # Аутентификация
│   │       ├── tasks.py         # Задачи
│   │       └── users.py         # Пользователи
│   ├── core/
│   │   ├── enums.py             # Enum типы
│   │   ├── settings.py          # Настройки
│   │   ├── security.py          # Безопасность
│   │   └── securuty/
│   │       ├── jwt_private.pem
│   │       └── jwt_public.pem
│   ├── db/
│   │   ├── models.py            # SQLAlchemy модели
│   │   ├── base.py              # Базовый класс
│   │   └── dao/                 # Data Access Objects
│   │       ├── user.py
│   │       ├── task.py
│   │       └── task_permission.py
│   ├── dependencies/             # Инъекции зависимостей
│   │       ├── task.py
│   │       ├── user.py
│   │       └── permissions.py
│   ├── logger/                   # Логгер для проекта
│   │       └── file_logger.py
│   ├── models/                   # Полезные функции
│   │       ├── jwt_utils.py
│   │       └── pwd_utils.py
│   ├── models/                   # Pydantic схемы
│   │       ├── login_schema.py
│   │       ├── task_schema.py
│   │       └── user_schema.py
│   └── utils/
│       ├── jwt_utils.py         # JWT операции
│       ├── pwd_utils.py         # Хеширование паролей
│       └── permission_utils.py  # Утилиты прав
│  
├── tests/
│   ├── conftest.py              # Фикстуры pytest
│   ├── factories.py             # factory-boy фабрики
│   ├── test_auth_api.py         # Тесты аутентификации
│   ├── test_tasks_api.py        # Тесты задач
│   ├── test_users_api.py        # Тесты пользователей
│   └── test_db.py               # Тесты базы данных
├── logs/                        # Логи приложения
├── Dockerfile
├── docker-compose.yml
├── requirements.txt          # Основные зависимости
├── pytest.ini                # Конфигурация pytest
├── .env.example              # Пример переменных окружения
├── main.py                   # Точка входа
└── README.md                 # Этот файл
```

## 🐳 Docker

### Сборка образа
```bash
docker build -t task-tracker-api .
```

### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: task_user
      POSTGRES_PASSWORD: task_password
      POSTGRES_DB: task_tracker
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://task_user:task_password@postgres/task_tracker
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## 🔧 Разработка

### Форматирование кода
```bash
# Автоматическое форматирование
black app/
isort app/

# Проверка типов
mypy app/

# Проверка безопасности
bandit -r app/
```

### Git workflow
```bash
# Перед коммитом
make test
black app/
isort app/
mypy app/
```

### Добавление нового эндпоинта
1. Создать схему в `app/api/schemas/`
2. Создать DAO метод в `app/db/dao/`
3. Добавить эндпоинт в соответствующий файл `app/api/endpoints/`
4. Написать тесты в `tests/`
5. Обновить документацию

## 🚨 Ошибки и отладка

### Проверка JWT токена
```bash
# Вручную проверить токен
python -c "from app.utils.jwt_utils import decode_token; print(decode_token('your_token'))"
```

### Просмотр логов
```bash
# При локальном запуске
tail -f logs/app.log

# В Docker
docker-compose logs -f api
```

### Тестирование базовых операций
```bash
# Создание тестовой задачи
python scripts/create_test_task.py

# Проверка подключения к БД
python scripts/test_connection.py
```

## 📈 Мониторинг

### Health check
```
GET /health
```

### Метрики (опционально)
```
GET /metrics  # Для интеграции с Prometheus
```

## 🔒 Безопасность

- JWT токены с RSA ключами
- Хеширование паролей с bcrypt
- Валидация всех входных данных через Pydantic
- Автоматическая проверка прав доступа
- SQL injection protection через SQLAlchemy
- CORS настройки для клиентских приложений

## 🤝 Вклад в проект

1. Форкнуть репозиторий
2. Создать ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Зафиксировать изменения (`git commit -m 'Add amazing feature'`)
4. Отправить в форк (`git push origin feature/amazing-feature`)
5. Создать Pull Request

## 📄 Лицензия

Этот проект лицензируется под MIT License - см. файл LICENSE для деталей.

## 🙏 Благодарности

- FastAPI команде за отличный фреймворк
- SQLAlchemy за мощный ORM
- Всем контрибьюторам open-source проектов

---

**Примечания:**
- Все операции с БД асинхронные
- Для тестов используется SQLite
- JWT токены обновляются через refresh токены
- Система прав доступа позволяет гибко управлять доступом к задачам
- Поддерживается организационная структура (организации и группы)

Для дополнительной информации смотрите документацию API по адресу `http://localhost:8000/docs`