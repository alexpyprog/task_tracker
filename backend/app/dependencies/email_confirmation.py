from app.db.dao.email_confirmation import EmailConfirmationDAO


async def get_email_confirmation_dao() -> EmailConfirmationDAO:
    """DI для DAO подтверждений email"""
    return EmailConfirmationDAO()