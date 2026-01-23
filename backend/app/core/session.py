
from fastapi import Depends, Request, HTTPException, status

from app.core.db import get_db

from sqlalchemy.orm import Session

from app.models.user import User


def get_current_user_id(request: Request):
    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session found."
        )
    return user_id

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
    
    return user

def get_verified_user(
    request: Request,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if not request.session.get("2fa_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="2FA verification required."
        )
    
    return user

def clear_session(request: Request):
    request.session.clear()
    return

def set_session_verified(request: Request):
    if not request.session.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session found."
        )
    request.session["2fa_verified"] = True
    return