from typing import List, Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaskPermission
from app.core.security import get_current_user
from app.db.base import get_db
from app.db.dao.task import TaskDAO
from app.db.dao.task_permission import TaskPermissionDAO
from app.db.models import User
from app.dependencies.permissions import get_permission_dao
from app.dependencies.task import get_task_dao
from app.models.task_schema import TaskOut, TaskCreate, TaskListOut, TaskUpdate

tasks_rt = APIRouter(prefix="/tasks", tags=["Tasks"])


@tasks_rt.get(
    "/my-tasks",
    response_model=List[TaskListOut],
    description='Получить задачи, где текущий пользователь исполнитель'
)
async def get_my_tasks(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        task_status: Optional[str] = None,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        current_user: User = Depends(get_current_user)
) -> List[TaskListOut]:
    """
    Получить задачи, где текущий пользователь исполнитель
    :param skip: Offset of the tasks to skip
    :param limit: limit the number of tasks to return
    :param task_status: status of tasks to return
    :param session: Database session. Automatically populated.
    :param task_dao: Task DAO. Automatically populated.
    :param current_user: User data. Populated if authorized.
    :return: list of TaskListOut
    """
    tasks = await task_dao.get_by_worker(
        session=session,
        worker_id=current_user.id,
        skip=skip,
        limit=limit,
        status=task_status
    )

    return [TaskListOut.model_validate(task) for task in tasks]


@tasks_rt.get(
    "/created-by-me",
    response_model=List[TaskListOut],
    description='Получить задачи, созданные текущим пользователем'
)
async def get_created_by_me(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        task_status: Optional[str] = None,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        current_user: User = Depends(get_current_user)
) -> List[TaskListOut]:
    """
    Получить задачи, созданные текущим пользователем
    :param skip: Offset of the tasks to skip
    :param limit: limit the number of tasks to return
    :param task_status: status of tasks to return
    :param session: Database session. Automatically populated.
    :param task_dao: Task DAO. Automatically populated.
    :param current_user: User data. Populated if authorized.
    :return: list of TaskListOut
    """
    tasks = await task_dao.get_by_creator(
        session=session,
        creator_id=current_user.id,
        skip=skip,
        limit=limit,
        status=task_status
    )

    return [TaskListOut.model_validate(task) for task in tasks]


@tasks_rt.get(
    "/{task_id}",
    response_model=TaskOut,
    description='Получить задачу по ID (требует аутентификации)'
)
async def get_task(
        task_id: str,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        task_permission_dao: TaskPermissionDAO = Depends(get_permission_dao),
        current_user: User = Depends(get_current_user)
) -> TaskOut:
    """
    Получить задачу по ID (требует аутентификации)
    :param task_permission_dao: TaskPermissionDAO. Automatically populated.
    :param task_id: Task ID to retrieve
    :param session: Database session. Automatically populated.
    :param task_dao: Task DAO. Automatically populated.
    :param current_user: User data. Populated if authorized.
    :return: TaskOut model
    """
    task = await task_dao.get_by_id(session, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    has_permission = await task_permission_dao.has_permission(
        session,
        task_id=task_id,
        user_id=current_user.id,
        permission=TaskPermission.view
    )

    # Простая проверка прав - пользователь должен быть создателем или исполнителем
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this task",
        )

    return TaskOut.model_validate(task)


@tasks_rt.post(
    "/",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
    description='Создать новую задачу (требует аутентификации)'
)
async def create_task(
        task_data: TaskCreate,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        current_user: User = Depends(get_current_user),
        permission_dao: TaskPermissionDAO = Depends(get_permission_dao)
) -> TaskOut:
    """
    Создать новую задачу (требует аутентификации)
    :param permission_dao: task permission DAO. Automatically populated.
    :param task_data: Full dataset of the TaskCreate model
    :param session: Database session. Automatically populated.
    :param task_dao: Task DAO. Automatically populated.
    :param current_user: User data. Populated if authorized.
    :return: TaskOut model
    """
    # Проверяем, существует ли исполнитель
    if not await task_dao.user_exists(session, task_data.worker_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker not found",
        )

    # Создаем задачу от имени текущего пользователя
    task = await task_dao.create(
        session=session,
        title=task_data.title,
        description=task_data.description,
        deadline=task_data.deadline,
        created_by=current_user.id,
        worker_id=task_data.worker_id,
        status=task_data.status
    )

    # Создателю - все права на задачу
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.view)
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.edit)
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.delete)
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.assign)
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.change_status)
    await permission_dao.add_permission(session, task.id, current_user.id, TaskPermission.manage_permissions)

    # Исполнителю - только базовые права
    # Этот этап только если создатель и исполнитель задачи - разные люди.
    if current_user.id != task_data.worker_id:
        await permission_dao.add_permission(session, task.id, task.worker_id, TaskPermission.view)
        await permission_dao.add_permission(session, task.id, task.worker_id, TaskPermission.change_status)
        await permission_dao.add_permission(session, task.id, task.worker_id, TaskPermission.add_comment)
        await permission_dao.add_permission(session, task.id, task.worker_id, TaskPermission.add_attachment)

    return TaskOut.model_validate(task)


@tasks_rt.put(
    "/{task_id}",
    response_model=TaskOut,
    description='Обновить задачу (требует аутентификации и права EDIT)'
)
async def update_task(
        task_id: str,
        task_update: TaskUpdate,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        permission_dao: TaskPermissionDAO = Depends(get_permission_dao),
        current_user: User = Depends(get_current_user)
) -> TaskOut:
    """
    Обновить задачу (требует аутентификации и права EDIT)
    :param task_id: Task ID to update
    :param task_update: Full dataset of the TaskUpdate model
    :param session: Database session. Automatically populated.
    :param task_dao: Task DAO. Automatically populated.
    :param permission_dao: Permission DAO. Automatically populated.
    :param current_user: User data. Populated if authorized.
    :return: TaskOut model
    """

    # 1. Проверяем существование задачи
    task = await task_dao.get_by_id(session, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # 2. Проверяем права - пользователь должен иметь право EDIT
    has_edit_permission = await permission_dao.has_permission(
        session=session,
        task_id=task_id,
        user_id=current_user.id,
        permission=TaskPermission.edit
    )

    # Создатель задачи автоматически имеет все права
    is_creator = task.created_by == current_user.id

    if not (has_edit_permission or is_creator):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this task",
        )

    # 3. Проверка специфических прав для отдельных полей
    if task_update.worker_id is not None and task_update.worker_id != task.worker_id:
        # Для изменения исполнителя нужно право ASSIGN
        has_assign_permission = await permission_dao.has_permission(
            session=session,
            task_id=task_id,
            user_id=current_user.id,
            permission=TaskPermission.assign
        )

        if not (has_assign_permission or is_creator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to assign this task",
            )

        # Проверяем существование нового исполнителя
        if not await task_dao.user_exists(session, task_update.worker_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Worker not found",
            )

    # 4. Подготавливаем данные для обновления
    update_data = task_update.model_dump(exclude_unset=True)

    # Добавляем информацию о том, кто обновил
    update_data['updated_by'] = current_user.id

    # 5. Обновляем задачу
    updated_task = await task_dao.update(
        session=session,
        task_id=task_id,
        data=update_data
    )

    if updated_task is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task",
        )

    return TaskOut.model_validate(updated_task, from_attributes=True)


@tasks_rt.delete(
    '/{task_id}',
    description='Удалить задачу',
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_task(
        task_id: str,
        session: AsyncSession = Depends(get_db),
        task_dao: TaskDAO = Depends(get_task_dao),
        current_user: User = Depends(get_current_user),
        permission_dao: TaskPermissionDAO = Depends(get_permission_dao),
) -> None:
    has_permission = await permission_dao.has_permission(
        session=session,
        task_id=task_id,
        user_id=current_user.id,
        permission=TaskPermission.delete
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this task",
        )
    try:
        await task_dao.delete(
            session,
            task_id=task_id,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task",
        )
