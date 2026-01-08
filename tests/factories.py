import factory
from datetime import datetime, timedelta, timezone
from app.db.models import User, Task, Organization, Group, TaskPermissionModel
from app.core.enums import UserStatus, TaskStatus, TaskPermission
from app.utils.pwd_utils import hash_password


class UserFactory(factory.Factory):
    """Фабрика для создания пользователей"""

    class Meta:
        model = User
    # id = factory.Sequence(lambda n: n)
    username = factory.Sequence(lambda n: f"testuser{n}")
    full_name = factory.Faker("name")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    phone = factory.Sequence(lambda n: f"+7999{str(n).zfill(7)}")
    hashed_password = factory.LazyFunction(lambda: hash_password("testpassword123"))
    verified = True
    user_status = UserStatus.base_user
    organization_id = None
    group_id = None
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class TaskFactory(factory.Factory):
    """Фабрика для создания задач"""

    class Meta:
        model = Task

    id = factory.Faker("uuid4")
    title = factory.Faker("sentence")
    description = factory.Faker("text")
    deadline = factory.LazyFunction(
        lambda: datetime.now(timezone.utc) + timedelta(days=7)
    )
    created_by = factory.Sequence(lambda n: n + 1)
    worker_id = factory.Sequence(lambda n: n + 1)
    status = TaskStatus.created
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = None
    updated_by = None