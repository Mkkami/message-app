
from typing import Optional
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    
    totp_secret: Mapped[Optional[str]] = mapped_column(nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(default=False)

    keys: Mapped["UserKeys"] = relationship("UserKeys", back_populates="owner", uselist=False)

class UserKeys(Base):
    __tablename__ = "user_keys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    signing_pub_key: Mapped[str] = mapped_column()
    encryption_pub_key: Mapped[str] = mapped_column()
    signing_priv_key: Mapped[str] = mapped_column()
    encryption_priv_key: Mapped[str] = mapped_column()
    
    key_salt: Mapped[str] = mapped_column()

    owner: Mapped["User"] = relationship("User", back_populates="keys")
