from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dao.group import GroupDAO

def get_group_dao() -> GroupDAO:
    return GroupDAO()