"""
Account creation and lookup.

Mirrors the shape of the other *_service modules: routes stay thin and call
into here, this module owns the SQLAlchemy queries and commits.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyRegisteredError, InvalidCredentialsError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, *, full_name: str, email: str, password: str) -> User:
    email = email.lower().strip()
    existing = await get_user_by_email(db, email)
    if existing is not None:
        raise EmailAlreadyRegisteredError(
            "An account with this email already exists. Try logging in instead."
        )

    user = User(
        full_name=full_name.strip(),
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError("Incorrect email or password.")
    if not user.is_active:
        raise InvalidCredentialsError("This account has been deactivated.")
    return user


def issue_token(user: User) -> str:
    return create_access_token(subject=user.id)
