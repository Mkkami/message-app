from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.session import get_current_user, set_session_verified
from app.core.db import get_db
from sqlalchemy.orm import Session

from app.core.limit import limiter

from app.schemas.totp import TOTPVerify
from app.services.totp_service import TotpService
from app.exceptions.totp_errors import InvalidTotpTokenError, TotpAlreadyEnabledError
from app.models.user import User


router = APIRouter(
    prefix="/2fa",
    tags=["2fa"]
)

totp_service = TotpService()

@router.get("/setup")
async def setup_2fa(request: Request, user: User = Depends(get_current_user)):

    if user.is_2fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )

    raw_secret = totp_service.generate_secret()

    request.session["temp_totp_secret"] = raw_secret

    totp_uri = totp_service.get_totp_uri(raw_secret,user.username)

    return {
        "totp_uri": totp_uri,
        "secret": raw_secret
    }

@router.post("/verify")
@limiter.limit("5/5 minutes")
async def verify_2fa(
    data: TOTPVerify,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    raw_secret = request.session.get("temp_totp_secret")
    token = data.token

    if not isinstance(token, str) or not token.isdigit() or len(token) != 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA token format")

    try:
        # użytkownik nie dokończył konfiguracji 2FA przy rejestracji
        if raw_secret:
            totp_service.verify_and_activate(db, user, raw_secret, token)
            del request.session["temp_totp_secret"]
        else:
        # weryfikacja istniejącego tokenu 2FA przy logowaniu
            totp_service.verify_existing_token(user, token)

        set_session_verified(request)
        return {"status":"ok"}
            
    except InvalidTotpTokenError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except TotpAlreadyEnabledError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
