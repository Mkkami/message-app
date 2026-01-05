import fastapi
from starlette.middleware.sessions import SessionMiddleware

from app.core.settings import settings

from app.models import user, message
from app.api.user import router as user_router
from app.core.db import Base, engine

Base.metadata.create_all(bind=engine)

app = fastapi.FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie="session",
    max_age=3600 # 1 hour
)

app.include_router(user_router)

@app.get("/")
def read_root():
    return "Hello there."

@app.get("/debug")
def debug_endpoint():
    return {
        "database_url": settings.DATABASE_URL
    }