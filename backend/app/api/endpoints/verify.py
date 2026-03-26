import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, FastAPI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.settings import settings
from app.db.base import get_db
from app.db.dao.email_confirmation import EmailConfirmationDAO
from app.db.dao.user import UserDAO
from app.db.models import User
from app.dependencies.email_confirmation import get_email_confirmation_dao
from app.dependencies.user import get_user_dao
from app.logger.file_logger import CustomLogger
from app.models.email_schema import EmailVerificationResponse, EmailVerificationRequest, TokenVerificationResponse, \
    TokenVerificationRequest
from app.utils.pwd_utils import verify_password
from app.services.email_service import email_service
from app.services.email_templates import render_verification_email

logger = CustomLogger("verify")

verify_rt = APIRouter(
    tags=["Verify"],
    prefix='/api'
)


def register_router(app: FastAPI):
    app.include_router(verify_rt)


# ========== Password Verification ==========
class PasswordVerifyRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=255)


@verify_rt.post(
    "/verify-password",
    status_code=status.HTTP_200_OK,
    description="Verify current user's password"
)
async def verify_password_endpoint(
        data: PasswordVerifyRequest,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao)
) -> dict:
    """
    Verify the current user's password.
    Returns 200 if password is correct, 401 otherwise.
    """
    user = await user_dao.get_by_id(session, current_user.id)

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    return {"verified": True}


# ========== Email Verification ==========
@verify_rt.post(
    "/send-verification",
    response_model=EmailVerificationResponse,
    status_code=status.HTTP_200_OK,
    description="Send email verification link"
)
async def send_verification_email(
    data: EmailVerificationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    email_dao: EmailConfirmationDAO = Depends(get_email_confirmation_dao),
) -> EmailVerificationResponse:
    """
    Send email verification link to user's email address.
    Requires authentication.
    """
    # Check if email belongs to current user
    logger.info(f"Verifying user's email address: {data.email}")
    if current_user.email != data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address does not match your account"
        )

    # Check if email is already verified
    if current_user.verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Delete old tokens for this user
    await email_dao.delete_by_user_id(session, current_user.id)

    # Generate new token
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    # Save token to database
    logger.info('Creating confirmation link')
    await email_dao.create(
        session=session,
        user_id=current_user.id,
        token=token,
        expires_at=expires_at,
    )

    # Build verification URL
    frontend_url = settings.frontend_url or "http://localhost:3000"
    verification_url = f"{frontend_url}/verify-email?token={token}"

    # Рендерим шаблон письма
    logger.info('creating verification message')
    html_content, text_content = render_verification_email(
        username=current_user.username,
        verification_url=verification_url,
    )

    # Отправляем письмо
    logger.info('sending verification email')
    sent = await email_service.send_email(
        to_email=data.email,
        subject="Verify your email - TaskTracker",
        html_content=html_content,
        text_content=text_content,
    )

    if not sent:
        logger.warning(f"Failed to send verification email to {data.email}")

    return EmailVerificationResponse(
        message="Verification email sent. Please check your inbox.",
        email=data.email
    )


@verify_rt.post(
    "/verify-email",
    response_model=TokenVerificationResponse,
    status_code=status.HTTP_200_OK,
    description="Verify email by token"
)
async def verify_email_token(
    data: TokenVerificationRequest,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
    email_dao: EmailConfirmationDAO = Depends(get_email_confirmation_dao),
) -> TokenVerificationResponse:
    """
    Verify email using the token from verification link.
    Updates user's verified status to True.
    """
    # Find valid token
    confirmation = await email_dao.get_valid_by_token(session, data.token)

    if not confirmation:
        # Check if token exists but expired
        expired = await email_dao.get_by_token(session, data.token)
        if expired and expired.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired. Please request a new one."
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token."
        )

    # Get user
    user = await user_dao.get_by_id(session, confirmation.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # If already verified
    if user.verified:
        await email_dao.delete(session, confirmation)
        return TokenVerificationResponse(
            verified=True,
            message="Email already verified."
        )

    # Update user's verified status
    await user_dao.set_verified(session, user_id=user.id, verified=True)

    # Delete used token
    await email_dao.delete(session, confirmation)

    logger.info(f"User {user.id} ({user.email}) verified email successfully")

    return TokenVerificationResponse(
        verified=True,
        message="Email successfully verified!"
    )