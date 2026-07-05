from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.logging import logger
from app.db.database import get_db
from app.db.models import User
from app.models.schemas import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Create a new account.

    The password is hashed with bcrypt (see app/core/security.py) before it
    ever touches the database -- only that hash is written to the `users`
    table in storage/legalgpt.db. A JWT is returned immediately so the new
    user is logged in right away, without a separate login round-trip.
    """
    user = await user_service.create_user(
        db, full_name=request.full_name, email=request.email, password=request.password
    )
    token = user_service.issue_token(user)
    logger.info(f"New account created: {user.id} ({user.email})")
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Verify credentials against the stored bcrypt hash and issue a JWT.

    The frontend stores this token (localStorage) and sends it back as
    `Authorization: Bearer <token>` on every subsequent request, which is
    how the user stays logged in across page reloads / future visits
    without re-entering their password every time.
    """
    user = await user_service.authenticate_user(
        db, email=request.email, password=request.password
    )
    token = user_service.issue_token(user)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Resolves the current token back to a user -- used by the frontend on
    load to restore a session from a saved token."""
    return UserResponse.model_validate(current_user)
