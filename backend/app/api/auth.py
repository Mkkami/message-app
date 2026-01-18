
from fastapi import APIRouter, Depends, Form, Form, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.services.user_service import UserService

from app.core.limit import limiter

router = APIRouter(
    tags=["auth"]
)

@router.post("/login")
@limiter.limit("5/5 minutes")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user_service = UserService(db)
    user = user_service.validate_login(username, password)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    request.session["user_id"] = user.id
    request.session["2fa_verified"] = False

    if user.is_2fa_enabled:
        return {
            "target": "verify",
            "message": "Please enter 2FA code"
        }
    else: # gdy użytkownik nie dokończył konfiguracji 2FA przy rejestracji
        return {
            "target": "setup",
            "message": "2FA is not set up"
        }

