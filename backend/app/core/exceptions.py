"""RFC 7807 error handling and domain exceptions."""

from typing import Any
from uuid import UUID

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception with RFC 7807 fields."""

    def __init__(
        self,
        status: int,
        title: str,
        detail: str,
        error_type: str = "about:blank",
        extra: dict[str, Any] | None = None,
    ) -> None:
        self.status = status
        self.title = title
        self.detail = detail
        self.error_type = error_type
        self.extra = extra or {}
        super().__init__(detail)


class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: UUID | str) -> None:
        super().__init__(
            status=404,
            title="Not Found",
            detail=f"{resource} with id '{resource_id}' not found",
            error_type="errors/not_found",
        )


class ConflictException(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(
            status=409, title="Conflict", detail=detail,
            error_type="errors/conflict",
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Access denied") -> None:
        super().__init__(
            status=403, title="Forbidden", detail=detail,
            error_type="errors/forbidden",
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Invalid or expired token") -> None:
        super().__init__(
            status=401, title="Unauthorized", detail=detail,
            error_type="errors/unauthorized",
        )


class BadRequestException(AppException):
    def __init__(self, detail: str) -> None:
        super().__init__(
            status=400, title="Bad Request", detail=detail,
            error_type="errors/bad_request",
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register RFC 7807 error handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        body: dict[str, Any] = {
            "type": exc.error_type,
            "title": exc.title,
            "status": exc.status,
            "detail": exc.detail,
            "instance": str(request.url),
        }
        body.update(exc.extra)
        return JSONResponse(status_code=exc.status, content=body)
