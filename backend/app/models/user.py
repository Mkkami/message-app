
from xxlimited import Str
from sqlalchemy import Column, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import relationship
from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    enc_2fa_key = Column(String, nullable=True)

    keys = relationship("UserKeys", back_populates="owner", uselist=False)

class UserKeys(Base):
    __tablename__ = "user_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    signing_pub_key = Column(String)
    encryption_pub_key = Column(String)

    signing_priv_key = Column(String)
    encryption_priv_key = Column(String)
    
    key_salt = Column(String)

    owner = relationship("User", back_populates="keys")
