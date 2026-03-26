# fix_passwords.py
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.db.models import User
from app.core.settings import settings


async def fix_passwords():
    engine = create_async_engine(settings.db_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Получаем всех пользователей
        result = await session.execute(select(User))
        users = result.scalars().all()

        for user in users:
            # Для каждого пользователя спросим новый пароль
            print(f"\nUser: {user.username} ({user.full_name})")
            new_password = input(f"Enter new password for {user.username}: ")
            if new_password:
                new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
                user.hashed_password = new_hash
                print(f"Password updated for {user.username}")
            else:
                print(f"Skipped {user.username}")

        await session.commit()
        print("\nAll done!")


if __name__ == "__main__":
    asyncio.run(fix_passwords())