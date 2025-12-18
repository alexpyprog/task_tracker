from app.db.dao.user import UserDAO


async def get_user_dao():
    dao = UserDAO()
    return dao