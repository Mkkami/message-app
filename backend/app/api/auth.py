
from fastapi import APIRouter, Depends, Form, Form, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.services.user_service import UserService

from app.core.limit import limiter
from app.exceptions.user_errors import InvalidCredentialsError

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

    try:
        user = user_service.authenticate_user(username, password)


        request.session.clear()
        request.session["user_id"] = user.id
        request.session["2fa_verified"] = False

        if user.is_2fa_enabled:
            return {"target": "verify", "message": "2FA required"}
        
        return {"target": "setup", "message": "2FA setup required"}

    except InvalidCredentialsError:
        raise HTTPException(status_code=401, detail="Invalid username or password.")


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}