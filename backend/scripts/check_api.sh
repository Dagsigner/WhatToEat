#!/usr/bin/env bash
# План проверки API WhatToEat. Запускать при поднятом сервере: uvicorn app.main:app --host 127.0.0.1 --port 8000
# Использование: ./scripts/check_api.sh [BASE_URL]
# Пример с токеном админа: ACCESS_TOKEN="..." ./scripts/check_api.sh

set -e
BASE_URL="${1:-http://127.0.0.1:8000}"
FAILED=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_code="$4"
  local extra_args=("${@:5}")
  local url="${BASE_URL}${path}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${extra_args[@]}" "$url")
  if [ "$code" = "$expected_code" ]; then
    echo "[OK] $name -> $code"
  else
    echo "[FAIL] $name: expected $expected_code, got $code"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== Блок 0: Базовая доступность ==="
check "1. Запуск: GET /health" GET "/health" 200
check "2. OpenAPI: GET /openapi.json" GET "/openapi.json" 200

echo ""
echo "=== Блок 1: Auth (без валидных данных — только коды) ==="
check "3. POST /api/v1/auth/login без тела" POST "/api/v1/auth/login" 422
# С валидным Telegram hash нужны реальные данные — пропускаем в скрипте

echo ""
echo "=== Публичные/защищённые без токена ==="
check "4. GET /api/v1/users/me без токена -> 401" GET "/api/v1/users/me" 401
check "5. GET /api/v1/users/admin без токена -> 401" GET "/api/v1/users/admin" 401
check "6. GET /api/v1/categories (публичный)" GET "/api/v1/categories" 200
check "7. GET /api/v1/ingredients (публичный, если есть)" GET "/api/v1/ingredients" 200
check "8. GET /api/v1/recipes (публичный)" GET "/api/v1/recipes" 200
check "9. GET /api/v1/images без токена -> 401" GET "/api/v1/images" 401

echo ""
if [ $FAILED -eq 0 ]; then
  echo "Все проверки пройдены."
else
  echo "Провалено проверок: $FAILED"
  exit 1
fi
