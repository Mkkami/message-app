
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import UserService

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

    if user_service.get_user_by_username(user.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists."
        )
    
    return user_service.create_user(user)

@router.get("/check_username")
def check_username(
    username: str,
    db: Session = Depends(get_db)
        ):
    user_service = UserService(db)

    if user_service.get_user_by_username(username):
        return {"exists": True}
    return {"exists": False}