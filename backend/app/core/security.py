"""
Password hashing + JWT helpers.

Passwords are NEVER stored in plaintext. `hash_password` runs bcrypt (via
passlib) with a per-password random salt baked into the output hash, and
that hash string is the only thing persisted (in `users.hashed_password`,
see app/db/models.py). Login verifies by re-hashing the candidate password
with the stored salt and comparing -- the original password is never
recovered or compared directly.

Sessions are stateless JWTs signed with `settings.secret_key` (HS256).
The frontend stores the resulting token (see frontend/src/lib/auth.ts) and
sends it back as `Authorization: Bearer <token>` on every request; this
file is what mints and later verifies that token.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Returns the user id (subject) encoded in the token, or None if the
    token is missing, malformed, expired, or signed with the wrong key."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
