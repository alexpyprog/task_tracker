from app.db.dao.task import TaskDAO


async def get_task_dao() -> TaskDAO:
    dao = TaskDAO()
    return dao