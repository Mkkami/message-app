import fastapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.sessions import SessionMiddleware

from app.core.settings import settings
from app.core.limit import limiter

from app.api.user import router as user_router
from app.api.totp import router as totp_router
from app.api.auth import router as auth_router
from app.api.message import router as mess_router
from app.core.db import Base, engine

Base.metadata.create_all(bind=engine)

app = fastapi.FastAPI(
    root_path="/api",
    # docs_url="/docs",
    # openapi_url="/openapi.json",
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie="session",
    same_site="lax", # csrf
    max_age=3600, # 1 hour
    https_only=True,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(user_router)
app.include_router(totp_router)
app.include_router(auth_router)
app.include_router(mess_router)
