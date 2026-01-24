
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.user import RegisterSuccess, UserCreate
from app.services.user_service import UserService
from app.exceptions.user_errors import UsernameAlreadyExistsError, WeakPasswordError
from app.models.user import User
from app.core.limit import limiter
from app.core.session import get_verified_user

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/register", response_model=RegisterSuccess)
@limiter.limit("5/minute")
def register(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    try:
        new_user = user_service.create_user(user)
        request.session["user_id"] = new_user.id
        request.session["2fa_verified"] = False
        return { "message": "User registered", "redirect": "/setup-2fa"} 
    except WeakPasswordError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except UsernameAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=e.message)
    
@router.get("/me/keys")
def get_my_keys(
    user: User = Depends(get_verified_user)
):
    return {
        "keys": {
            "signing_pub_key": user.keys.signing_pub_key,
            "encryption_pub_key": user.keys.encryption_pub_key,
            "signing_priv_key": user.keys.signing_priv_key,
            "encryption_priv_key": user.keys.encryption_priv_key,
            "key_salt": user.keys.key_salt
        }
    }

@router.get("/search")
@limiter.limit("20/minute")
def search_users(
    username: str,
    request: Request, # musi być aby limit działał
    db: Session = Depends(get_db),
    _ = Depends(get_verified_user) # tylko 2fa verified
):
    user_service = UserService(db)
    user = user_service.get_user_by_username(username)

    if not user:
        raise HTTPException(status_code=404,detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "publicKey": user.keys.encryption_pub_key
    }

@router.get("/check_username")
@limiter.limit("5/minute")
def check_username(
    username: str,
    request: Request, # limiter
    db: Session = Depends(get_db)
):
    user_service = UserService(db)

    if user_service.get_user_by_username(username):
        return {"exists": True}
    return {"exists": False}

