
from pydantic import BaseModel

class Keys(BaseModel):
    signing_pub_key: str
    encryption_pub_key: str
    signing_priv_key: bytes
    encryption_priv_key: bytes
    signing_priv_iv: bytes
    encryption_priv_iv: bytes
    key_salt: str

class UserCreate(BaseModel):
    username: str
    password: str
    keys: Keys

class UserRead(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
