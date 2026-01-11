import fastapi
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.sessions import SessionMiddleware

from app.core.settings import settings

from app.api.user import router as user_router
from app.api.totp import router as totp_router
from app.api.auth import router as auth_router
from app.core.db import Base, engine

Base.metadata.create_all(bind=engine)

app = fastapi.FastAPI(
    root_path="/api",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie="session",
    same_site="lax", # csrf
    max_age=3600 # 1 hour
)

app.include_router(user_router)
app.include_router(totp_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return "Hello there. 11221"

@app.get("/debug")
def debug_endpoint():
    return {
        "database_url": settings.DATABASE_URL
    }