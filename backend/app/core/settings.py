
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SESSION_SECRET_KEY: str
    SERVER_MASTER_KEY: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()