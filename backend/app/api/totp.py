import base64
import io
from fastapi import APIRouter, Depends, HTTPException, Request, security, status
import pyotp
import qrcode

from app.core.session import get_current_user_id
from app.core.db import get_db
from sqlalchemy.orm import Session

from app.models.user import User
from app.core import security_2fa
from app.schemas.totp import TOTPVerify


router = APIRouter(
    prefix="/2fa",
    tags=["2fa"]
)



@router.get("/setup")
async def setup_2fa(
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_current_user_id(request)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.totp_secret:
        raw_secret = pyotp.random_base32()
        user.totp_secret = security_2fa.encrypt_2fa_key(raw_secret)
        db.commit()
    else:
        raw_secret = security_2fa.decrypt_2fa_key(user.totp_secret)

    totp_uri = pyotp.totp.TOTP(raw_secret).provisioning_uri(
        name=user.username,
        issuer_name="SecureMsgApp"
    )

    return {
        "totp_uri": totp_uri,
        "secret": raw_secret
    }

@router.post("/verify")
async def verify_2fa(
    data: TOTPVerify,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = request.session.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA not set up")
    
    code = data.token

    if not isinstance(code, str) or not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA token format")

    raw_secret = security_2fa.decrypt_2fa_key(user.totp_secret)
    totp = pyotp.TOTP(raw_secret)

    if totp.verify(code, valid_window=1):
        user.is_2fa_enabled = True
        db.commit()
        request.session["is_2fa_authenticated"] = True
        return {"status": "ok"}
    
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA token")