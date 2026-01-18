
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.user import RegisterSuccess, UserCreate
from app.services.user_service import UserService
from app.exceptions.weak_password_exception import WeakPasswordException
from app.models.user import User
from app.core.limit import limiter

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/register", response_model=RegisterSuccess)
def register(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    try:
        new_user = user_service.create_user(user)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(ve)
        )
    except WeakPasswordException as wpe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=wpe.message
        )
    
    request.session["user_id"] = new_user.id
    request.session["2fa_verified"] = False

    return { 
        "message": "User registered successfully",
        "redirect": "/setup-2fa"
    } 

@router.get("/check_username")
@limiter.limit("10/1 minute")
def check_username(
    username: str,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    if user_service.get_user_by_username(username):
        return {"exists": True}
    return {"exists": False}

@router.get("/me/keys")
def get_my_keys(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")

    if not request.session.get("2fa_verified") and request.session.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="2FA verification required"
        )
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
@limiter.limit("20/1 minute")
def search_users(
    username: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "id": user.id,
        "username": user.username,
        "publicKey": user.keys.encryption_pub_key
    }