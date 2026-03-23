from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient


class TestTasksAPI:
    """Тесты для эндпоинтов задач"""

    @pytest.mark.asyncio
    async def test_create_task_success(
            self, authenticated_client: AsyncClient, test_user
    ):
        """Успешное создание задачи"""
        task_data = {
            "title": "Тестовая задача",
            "description": "Описание тестовой задачи",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "worker_id": test_user.id,
            "status": "created"
        }

        response = await authenticated_client.post("/tasks/", json=task_data)

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["description"] == task_data["description"]
        assert data["worker_id"] == task_data["worker_id"]
        assert data["status"] == task_data["status"]
        assert "id" in data
        assert "created_by" in data
        assert data["created_by"] == test_user.id

    @pytest.mark.asyncio
    async def test_create_task_invalid_worker(
            self, authenticated_client: AsyncClient
    ):
        """Создание задачи с несуществующим исполнителем"""
        task_data = {
            "title": "Тестовая задача",
            "worker_id": 99999,  # Несуществующий ID
            "status": "created"
        }

        response = await authenticated_client.post("/tasks/", json=task_data)

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "worker" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_task_success(
            self, authenticated_client: AsyncClient, test_task
    ):
        """Успешное получение задачи"""
        response = await authenticated_client.get(f"/tasks/{test_task.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title
        assert data["description"] == test_task.description

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, authenticated_client: AsyncClient):
        """Получение несуществующей задачи"""
        response = await authenticated_client.get("/tasks/nonexistent-id")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_task_success(
            self, authenticated_client: AsyncClient, test_task
    ):
        """Успешное обновление задачи"""
        update_data = {
            "title": "Обновленное название",
            "description": "Обновленное описание",
            "status": "in_progress"
        }

        response = await authenticated_client.put(
            f"/tasks/{test_task.id}",
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["status"] == update_data["status"]
        assert data["id"] == test_task.id

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, authenticated_client: AsyncClient):
        """Обновление несуществующей задачи"""
        update_data = {"title": "Новое название"}

        response = await authenticated_client.put(
            "/tasks/nonexistent-id",
            json=update_data
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_task_unauthorized(
            self, async_client: AsyncClient, test_task, test_user
    ):
        """Обновление задачи другим пользователем (не создателем)"""
        # Создаем другого пользователя
        from tests.factories import UserFactory
        from app.utils.jwt_utils import create_access_token

        other_user = UserFactory(username="otheruser")

        # Получаем токен для другого пользователя
        other_token = create_access_token(other_user.id)
        headers = {"Authorization": f"Bearer {other_token}"}

        update_data = {"title": "Попытка изменить"}

        response = await async_client.put(
            f"/tasks/{test_task.id}",
            json=update_data,
            headers=headers
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_delete_task_success(
            self, authenticated_client: AsyncClient, test_task
    ):
        """Успешное удаление задачи"""
        response = await authenticated_client.delete(f"/tasks/{test_task.id}")

        assert response.status_code == 204

        # Проверяем, что задача удалена
        get_response = await authenticated_client.get(f"/tasks/{test_task.id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_my_tasks(
            self, authenticated_client: AsyncClient, test_user, db_session
    ):
        """Получение задач текущего пользователя"""
        # Создаем несколько задач для пользователя
        from tests.factories import TaskFactory

        tasks = [
            TaskFactory(created_by=test_user.id, worker_id=test_user.id),
            TaskFactory(created_by=test_user.id, worker_id=test_user.id),
            TaskFactory(created_by=test_user.id, worker_id=999),  # Другой исполнитель
        ]

        for task in tasks:
            db_session.add(task)
        await db_session.commit()

        response = await authenticated_client.get("/tasks/my-tasks")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Должны быть только задачи, где пользователь исполнитель
        assert len(data) == 2  # Только первые две задачи

    @pytest.mark.asyncio
    async def test_get_created_by_me(
            self, authenticated_client: AsyncClient, test_user, db_session
    ):
        """Получение задач, созданных пользователем"""
        from tests.factories import TaskFactory

        tasks = [
            TaskFactory(created_by=test_user.id, worker_id=test_user.id),
            TaskFactory(created_by=test_user.id, worker_id=999),
            TaskFactory(created_by=888, worker_id=test_user.id),  # Другой создатель
        ]

        for task in tasks:
            db_session.add(task)
        await db_session.commit()

        response = await authenticated_client.get("/tasks/created-by-me")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Должны быть только задачи созданные пользователем
        assert len(data) == 2  # Только первые две задачи

    @pytest.mark.asyncio
    async def test_change_task_status(
            self, authenticated_client: AsyncClient, test_task
    ):
        """Изменение статуса задачи"""
        response = await authenticated_client.put(
            f"/tasks/{test_task.id}",
            json={"status": "completed"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["id"] == test_task.id