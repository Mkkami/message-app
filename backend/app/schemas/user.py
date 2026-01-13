
from pydantic import BaseModel, Field

class Keys(BaseModel):
    signing_pub_key: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]+$")
    encryption_pub_key: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]+$")

    # 120 hex (12B IV + 32B key + 16B tag = 60B)
    signing_priv_key: str = Field(..., min_length=120, max_length=120, pattern=r"^[0-9a-fA-F]+$")
    encryption_priv_key: str = Field(..., min_length=120, max_length=120, pattern=r"^[0-9a-fA-F]+$")

    key_salt: str = Field(..., min_length=32, max_length=32, pattern=r"^[0-9a-fA-F]+$")

class UserCreate(BaseModel):
    username: str = Field(..., pattern=r"^[a-zA-Z0-9_-]+$", max_length=32)
    password: str = Field(..., min_length=8)
    keys: Keys

class UserRead(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class RegisterSuccess(BaseModel):
    message: str
    redirect: str