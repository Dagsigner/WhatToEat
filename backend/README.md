# WhatToEat Backend

Recipe management backend built with FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16 and Redis 7.

## Quick Start (Docker)

The fastest way to get everything running:

```bash
cp .env.example .env    # configure environment variables
make build              # build the app image
make up                 # start postgres, redis, app
make migrate            # apply database migrations
```

The API will be available at `http://localhost:8000`. OpenAPI docs at `/docs`.

## Quick Start (Local)

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

This starts PostgreSQL 16 and Redis 7.

### 2. Install dependencies

```bash
poetry install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run migrations

```bash
poetry run alembic upgrade head
```

### 5. Start the server

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. OpenAPI docs at `/docs`.

### 6. Create the first admin

After the first user logs in via Telegram, grant admin privileges by inserting a record into the `admins` table:

```sql
INSERT INTO admins (id, user_id, created_at, updated_at)
VALUES (gen_random_uuid(), '<user_id>', now(), now());
```

Replace `<user_id>` with the UUID of the user from the `users` table.

## Make Commands

All commands run from the `backend/` directory.

| Command               | Description                                          |
|-----------------------|------------------------------------------------------|
| `make up`             | Start local dev environment                          |
| `make down`           | Stop local dev environment                           |
| `make build`          | Rebuild app Docker image                             |
| `make logs`           | Tail app container logs                              |
| `make migrate`        | Run Alembic migrations in container                  |
| `make merge-to-docker`| Перенести данные из локальной БД (5432) в Docker     |
| `make shell`          | Open shell in app container                          |
| `make test`           | Run tests in container                               |
| `make lint`           | Run ruff linter locally                              |
| `make prod-up`        | Start production environment                         |
| `make prod-down`      | Stop production environment                          |
| `make help`           | Show all available commands                         |

## Единая база данных (Docker)

**Приложение всегда работает с одной БД — в Docker.** Postgres в контейнере слушает порты 5432 и 5433 с хоста.

Чтобы собрать все данные в эту единую БД (если рецепты/категории остались в локальном PostgreSQL на 5432):

1. Запусти Docker: `make up`, затем `make migrate`.
2. Убедись, что локальный PostgreSQL с данными запущен на порту 5432.
3. Выполни один раз:
   ```bash
   make merge-to-docker
   ```
   Скрипт копирует данные из localhost:5432 → localhost:5433 (БД в Docker). Дубликаты по `id` не создаются (ON CONFLICT DO NOTHING). После этого вся работа идёт только с БД в Docker.

## Production Deployment

```bash
cp .env.prod.example .env.prod   # fill in real secrets
make prod-up                      # start with docker-compose.prod.yml
```

Production compose uses `restart: unless-stopped`, no volume mounts, and reads secrets from `.env.prod`.

## Project Structure

```
backend/
  app/
    config.py           # Pydantic Settings
    database.py         # Async engine & session
    dependencies.py     # FastAPI DI (db session, auth, pagination)
    exceptions.py       # RFC 7807 error handling
    main.py             # FastAPI app entry point
    mixins.py           # SQLAlchemy mixins (UUID, Timestamp, SoftDelete)
    pagination.py       # Pagination utilities
    modules/
      auth/             # Telegram auth, JWT tokens
      users/            # User model, schemas, service
      recipes/          # Recipe model, schemas, service
      ingredients/      # Ingredient + RecipeIngredient
      categories/       # Category + RecipeCategory
      steps/            # Recipe steps
      favorites/        # Favorite recipes
      cooking_history/  # Cooking history records
      images/           # Image metadata
      files/            # File upload
  alembic/              # Database migrations
  tests/                # API tests (pytest)
```

## Tech Stack

| Category   | Technology              |
|------------|-------------------------|
| Language   | Python 3.11+            |
| Framework  | FastAPI                 |
| ORM        | SQLAlchemy 2.0 (async)  |
| Database   | PostgreSQL 16           |
| Cache      | Redis 7                 |
| Migrations | Alembic                 |
| Auth       | JWT + Telegram Login    |
| Validation | Pydantic v2             |
| Logging    | structlog (JSON)        |
| Linting    | ruff, mypy              |
| Deps       | Poetry                  |

## Testing

Tests use a real PostgreSQL database. Before running tests, create the test database:

```sql
CREATE DATABASE whattoeat_test;
```

By default tests connect to `postgresql+asyncpg://whattoeat:whattoeat_secret@localhost:5432/whattoeat_test`.
Override by setting the `TEST_DATABASE_URL` environment variable.

```bash
# Run tests in Docker
make test

# Run tests locally
poetry run pytest -v

# Run a specific test file
poetry run pytest tests/test_health.py -v
```

Tables are created automatically via `Base.metadata.create_all` at the start of the test session
and dropped after all tests complete. Each test runs inside a transaction that is rolled back,
so tests do not pollute each other.

## Development

```bash
# Lint
poetry run ruff check .

# Format
poetry run ruff format .

# Type check
poetry run mypy app/

# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head
```

## API Smoke Test

```bash
./scripts/check_api.sh
# or with a different host/port:
./scripts/check_api.sh http://localhost:8000
```
