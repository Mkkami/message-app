
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.user import RegisterSuccess, UserCreate
from app.services.user_service import UserService
from app.exceptions.weak_password_exception import WeakPasswordException

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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except WeakPasswordException as wpe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=wpe.message
        )
    
    request.session["user_id"] = new_user.id
    request.session["is_2fa_completed"] = False

    return { 
        "message": "User registered successfully",
        "redirect": "/setup-2fa"
    } 

@router.get("/check_username")
def check_username(
    username: str,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    if user_service.get_user_by_username(username):
        return {"exists": True}
    return {"exists": False}