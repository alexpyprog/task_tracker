import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.pwd_utils import hash_password
from tests.conftest import db_session
from tests.factories import UserFactory


class TestUsersAPI:
    """Тесты для эндпоинтов пользователей"""

    @pytest.mark.asyncio
    async def test_get_current_user_info(
            self, authenticated_client: AsyncClient, test_user
    ):
        """GET /users/me - получение текущего пользователя"""
        response = await authenticated_client.get("/users/me")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_update_current_user_info(
            self, authenticated_client: AsyncClient, test_user
    ):
        """PATCH /users/{id} - обновление текущего пользователя"""
        update_data = {
            "full_name": "Новое имя",
            "phone": "+79991112233"
        }

        response = await authenticated_client.patch(f"/users/{test_user.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
        assert data["phone"] == update_data["phone"]

    @pytest.mark.asyncio
    async def test_get_user_by_id(
            self, authenticated_client: AsyncClient, test_user
    ):
        """GET /users/{id} - получение пользователя по ID"""
        response = await authenticated_client.get(f"/users/{test_user.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_get_user_by_username(
            self, authenticated_client: AsyncClient, test_user
    ):
        """GET /users/by-username/{username} - получение пользователя по username"""
        response = await authenticated_client.get(f"/users/by-username/{test_user.username}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username

    @pytest.mark.asyncio
    async def test_get_user_by_username_not_found(
            self, authenticated_client: AsyncClient
    ):
        """GET /users/by-username/{username} - пользователь не найден"""
        response = await authenticated_client.get("/users/by-username/nonexistent_user")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "User not found"

    @pytest.mark.asyncio
    async def test_get_user_not_found(
            self, authenticated_client: AsyncClient
    ):
        """GET /users/{id} - пользователь не найден"""
        response = await authenticated_client.get("/users/999999")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "User not found"

    @pytest.mark.asyncio
    async def test_update_user_unauthorized(
            self, authenticated_client: AsyncClient, db_session: AsyncSession
    ):
        """PATCH /users/{id} - попытка обновить другого пользователя"""
        update_data = {"full_name": "Попытка взлома"}

        # Пытаемся обновить другого пользователя (test_user2 вместо текущего)
        test_user2 = UserFactory(username="evil_hecker")
        db_session.add(test_user2)
        await db_session.commit()
        await db_session.refresh(test_user2)

        response = await authenticated_client.patch(f"/users/{test_user2.id}", json=update_data)
        print(response.json())

        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
        assert "permission" in data["detail"].lower() or "forbidden" in data["detail"]

    @pytest.mark.asyncio
    async def test_update_user_not_found(
            self, authenticated_client: AsyncClient
    ):
        """PATCH /users/{id} - пользователь не найден"""
        update_data = {"full_name": "Несуществующий пользователь"}

        response = await authenticated_client.patch("/users/999999", json=update_data)

        assert response.status_code == 403  # Сначала проверка на свои права
        # или 404, если проверка проходит, но пользователь не найден

    @pytest.mark.asyncio
    async def test_update_user_partial_data(
            self, authenticated_client: AsyncClient, test_user
    ):
        """PATCH /users/{id} - частичное обновление данных"""
        # Обновляем только одно поле
        update_data = {"phone": "+78887776655"}

        response = await authenticated_client.patch(f"/users/{test_user.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == update_data["phone"]
        # Проверяем, что другие поля не изменились
        assert data["username"] == test_user.username
        if test_user.full_name:
            assert data["full_name"] == test_user.full_name

    @pytest.mark.asyncio
    async def test_update_user_empty_data(
            self, authenticated_client: AsyncClient, test_user
    ):
        """PATCH /users/{id} - пустой запрос на обновление"""
        update_data = {}

        response = await authenticated_client.patch(f"/users/{test_user.id}", json=update_data)
        print(response.json())

        assert response.status_code == 200  # или 422 если валидация
        data = response.json()
        # Должен вернуться пользователь без изменений
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username

    @pytest.mark.asyncio
    async def test_delete_user_success(
            self, authenticated_client: AsyncClient, db_session
    ):
        """DELETE /users/{id} - успешное удаление пользователя"""
        # Создаем временного пользователя для удаления
        from app.db.models import User

        temp_user = User(
            username="user_to_delete",
            full_name="User To Delete",
            email="delete@example.com",
            phone="+79996665544",
            hashed_password=hash_password("hashed_password")
        )
        db_session.add(temp_user)
        await db_session.commit()
        await db_session.refresh(temp_user)

        response = await authenticated_client.delete(f"/users/{temp_user.id}")
        print(response.json())

        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert data["result"] is True or isinstance(data["result"], dict)

        # Проверяем, что пользователь действительно удален
        response = await authenticated_client.get(f"/users/{temp_user.id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_user_not_found(
            self, authenticated_client: AsyncClient
    ):
        """DELETE /users/{id} - пользователь не найден"""
        response = await authenticated_client.delete("/users/7126832544132")
        print(response.json())

        # В зависимости от реализации: 404 если проверка доступа проходит
        # или 403 если сначала проверяется доступ
        assert response.status_code in [403, 404]
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(
            self, async_client: AsyncClient
    ):
        """GET /users/me - без аутентификации"""
        response = await async_client.get("/users/me")

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_update_profile_photo_only(
            self, authenticated_client: AsyncClient, test_user
    ):
        """PATCH /users/{id} - обновление только фото профиля"""
        update_data = {
            "profile_photo_path": "/uploads/profile_photos/new_photo.jpg"
        }

        response = await authenticated_client.patch(f"/users/{test_user.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["profile_photo_path"] == update_data["profile_photo_path"]

    @pytest.mark.asyncio
    async def test_user_search_functionality(
            self, authenticated_client: AsyncClient, test_user
    ):
        """GET различных эндпоинтов - проверка поиска пользователей"""
        # Поиск по ID
        response = await authenticated_client.get(f"/users/{test_user.id}")
        assert response.status_code == 200
        assert response.json()["username"] == test_user.username

        # Поиск по username
        response = await authenticated_client.get(f"/users/by-username/{test_user.username}")
        assert response.status_code == 200
        assert response.json()["username"] == test_user.username

        # Текущий пользователь
        response = await authenticated_client.get("/users/me")
        assert response.status_code == 200
        assert response.json()["username"] == test_user.username