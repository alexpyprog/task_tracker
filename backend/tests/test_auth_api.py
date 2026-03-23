import pytest
from httpx import AsyncClient
from app.db.models import User


class TestAuthAPI:
    """Тесты для эндпоинтов аутентификации"""

    @pytest.mark.asyncio
    async def test_register_user_success(self, async_client: AsyncClient, db_session):
        """Успешная регистрация пользователя"""
        user_data = {
            "username": "newuser",
            "password": "securepassword123",
            "full_name": "New User",
            "email": "newuser@example.com",
            "phone": "+79991234567"
        }

        response = await async_client.post("/api/register", json=user_data)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "hashed_password" not in data

        # Проверяем, что пользователь создан в БД
        from sqlalchemy import select
        result = await db_session.execute(select(User).where(User.username == "newuser"))
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.verified is False  # По умолчанию не верифицирован

    @pytest.mark.asyncio
    async def test_register_user_duplicate_username(self, async_client: AsyncClient, test_user):
        """Регистрация с существующим username"""
        user_data = {
            "username": test_user.username,  # Существующий username
            "password": "password123",
            "full_name": "Test User",
            "email": "different@example.com",
            "phone": "+79998765432"
        }

        response = await async_client.post("/api/register", json=user_data)

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "username" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, test_user):
        """Успешный логин"""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123"
        }

        response = await async_client.post("/api/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 100  # Проверяем, что токен не пустой

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client: AsyncClient, test_user):
        """Логин с неверным паролем"""
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword"
        }

        response = await async_client.post("/api/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        """Логин несуществующего пользователя"""
        login_data = {
            "username": "nonexistent",
            "password": "password123"
        }

        response = await async_client.post("/api/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, async_client: AsyncClient, test_user):
        """Успешное обновление токена"""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123"
        }
        login_response = await async_client.post("/api/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Обновляем токен
        refresh_response = await async_client.post(
            "/api/refresh",
            json={"refresh_token": refresh_token}
        )

        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, async_client: AsyncClient):
        """Обновление с невалидным токеном"""
        response = await async_client.post(
            "/api/refresh",
            json={"refresh_token": "invalid.token.here"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token(self, async_client: AsyncClient):
        """Доступ к защищенному эндпоинту без токена"""
        response = await async_client.get("/api/tasks/my-tasks")
        print(response)
        print(response.json())

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_protected_endpoint_with_invalid_token(self, async_client: AsyncClient):
        """Доступ к защищенному эндпоинту с невалидным токеном"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = await async_client.get("/api/tasks/my-tasks", headers=headers)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_protected_endpoint_with_valid_token(
            self, authenticated_client: AsyncClient, test_task
    ):
        """Доступ к защищенному эндпоинту с валидным токеном"""
        response = await authenticated_client.get(f"/api/tasks/{test_task.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title