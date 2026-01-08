
from pydantic import BaseModel, Field

class Keys(BaseModel):
    signing_pub_key: str
    encryption_pub_key: str
    signing_priv_key: bytes
    encryption_priv_key: bytes
    signing_priv_iv: bytes
    encryption_priv_iv: bytes
    key_salt: str

class UserCreate(BaseModel):
    username: str = Field(..., pattern=r"^[a-zA-Z0-9_-]+$", max_length=32)
    password: str = Field(..., min_length=8)
    keys: Keys

class UserRead(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
