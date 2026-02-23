.DEFAULT_GOAL := help

.PHONY: up down build logs migrate shell test lint prod-up prod-down merge-to-docker help

up: ## Start local dev environment
	docker compose up -d

merge-to-docker: ## Merge data from local PostgreSQL (5432) into Docker DB (5433) — единая БД в Docker
	@echo "Перенос данных: локальная БД (5432) -> Docker (5433)..."
	poetry run python scripts/merge_docker_data_into_local.py

down: ## Stop local dev environment
	docker compose down

build: ## Rebuild app image
	docker compose build

logs: ## Tail app logs
	docker compose logs -f app

migrate: ## Run Alembic migrations in app container
	docker compose exec app alembic upgrade head

shell: ## Open shell in app container
	docker compose exec app bash || docker compose exec app sh

test: ## Run tests in app container
	docker compose exec app pytest tests/ -v

lint: ## Run linter locally
	poetry run ruff check .
	poetry run ruff format --check .

prod-up: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
