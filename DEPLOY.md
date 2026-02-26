# Деплой WhatToEat на Railway

Монорепозиторий: backend, frontend, client в одном репо.

## Автодеплой (основной способ)

Просто пушь в main — Railway автоматически деплоит изменённые сервисы.

```bash
git push
```

Каждый сервис деплоится только при изменениях в своей папке (watchPatterns в railway.toml).

### Настройка в Railway dashboard (уже сделана)

Для каждого сервиса в Settings:
- **Root Directory**: `backend` / `frontend` / `client`
- **Config File**: `/backend/railway.toml` / `/frontend/railway.toml` / `/client/railway.toml`

## Ручной деплой через CLI (fallback)

```bash
# Backend (FastAPI)
cd backend && railway status  # проверить что привязан к backend
railway up /Users/minatullaragimov/whattoeat/backend --path-as-root --detach

# Frontend (Vite + React)
cd frontend && railway status  # проверить что привязан к frontend
railway up /Users/minatullaragimov/whattoeat/frontend --path-as-root --detach

# Client (Next.js)
cd client && railway status  # проверить что привязан к client
railway up /Users/minatullaragimov/whattoeat/client --path-as-root --detach
```

Флаг `--path-as-root` обязателен — без него Railway не найдёт Dockerfile.

## Проверка

```bash
# Backend
curl https://backend-production-4dea.up.railway.app/health
# → {"app":"ok","redis":"ok"}

# /docs должен быть 404 (скрыт на проде)
curl -o /dev/null -w "%{http_code}" https://backend-production-4dea.up.railway.app/docs

# Frontend / Client
curl -o /dev/null -w "%{http_code}" https://frontend-production-44bb.up.railway.app/
curl -o /dev/null -w "%{http_code}" https://client-production-5b58.up.railway.app/
```

## Если railway status показывает не тот сервис

```bash
railway link  # выбрать нужный сервис из списка
```
