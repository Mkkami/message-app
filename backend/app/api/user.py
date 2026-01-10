
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import UserService
from app.exceptions.weak_password_exception import WeakPasswordException

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/register", response_model=UserRead)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    try:
        message = user_service.create_user(user)
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
    return message 

@router.get("/check_username")
def check_username(
    username: str,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    if user_service.get_user_by_username(username):
        return {"exists": True}
    return {"exists": False}