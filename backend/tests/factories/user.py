"""User factory for test data generation."""

import factory

from app.models.user import User


class UserFactory(factory.Factory):
    class Meta:
        model = User

    tg_id = factory.Sequence(lambda n: 100_000 + n)
    tg_username = factory.LazyAttribute(lambda o: f"user_{o.tg_id}")
    username = factory.LazyAttribute(lambda o: f"user_{o.tg_id}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
