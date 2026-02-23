"""Auth API router — login, refresh, logout endpoints."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_auth_service, get_current_admin, get_current_user
from app.schemas.auth import (
    AdminLoginRequest,
    AdminLoginResponse,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    RefreshResponse,
    TelegramAuthData,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=200)
async def login(
    auth_data: TelegramAuthData,
    service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    return await service.authenticate_telegram(auth_data)


@router.post("/login/admin", response_model=AdminLoginResponse, status_code=200)
async def login_admin(
    data: AdminLoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AdminLoginResponse:
    return await service.authenticate_admin(data.username, data.password)


@router.post("/refresh", response_model=RefreshResponse, status_code=200)
async def refresh(
    data: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> RefreshResponse:
    return await service.refresh_tokens(data.refresh_token)


@router.post("/logout", response_model=LogoutResponse, status_code=200)
async def logout(
    data: LogoutRequest | None = None,
    _user=Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    refresh_token = data.refresh_token if data else None
    return await service.logout(refresh_token)


@router.post("/logout/admin", response_model=LogoutResponse, status_code=200)
async def logout_admin(
    data: LogoutRequest | None = None,
    _admin=Depends(get_current_admin),
    service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    refresh_token = data.refresh_token if data else None
    return await service.logout(refresh_token)
