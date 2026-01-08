from app.db.dao.task_permission import TaskPermissionDAO


def get_permission_dao() -> TaskPermissionDAO:
    return TaskPermissionDAO()