"""JWT token creation, verification, and Telegram hash utilities."""

import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException


def create_access_token(user_id: UUID) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes,
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: UUID) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.jwt_refresh_token_expire_days,
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str, *, expected_type: str = "access") -> UUID:
    """Decode and validate a JWT token, returning the user UUID."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    token_type = payload.get("type")
    if token_type != expected_type:
        raise UnauthorizedException(f"Expected {expected_type} token, got {token_type}")

    sub = payload.get("sub")
    if sub is None:
        raise UnauthorizedException("Token missing subject")

    try:
        return UUID(sub)
    except ValueError:
        raise UnauthorizedException("Invalid subject in token")


def decode_token_payload(token: str) -> dict:
    """Decode token without type check — used for extracting jti/exp on logout."""
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")


def verify_telegram_hash(data: dict[str, str], bot_token: str) -> bool:
    received_hash = data.get("hash", "")
    check_data = {k: v for k, v in data.items() if k != "hash"}
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(check_data.items()))

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

    return hmac.compare_digest(computed_hash, received_hash)
