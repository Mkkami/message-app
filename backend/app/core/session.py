
from fastapi import Request, HTTPException, status


def get_current_user_id(request: Request):
    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session found."
        )
    return user_id