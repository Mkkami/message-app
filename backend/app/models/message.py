import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func
from app.core.db import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    ciphertext = Column(Text, nullable=False) # iv + ciphertext + tag

    eph_key = Column(String, nullable=False)
    
    # created_at = Column(DateTime(Timezone=True), server_default=func.now())
    recipients = relationship("MessageRecipient", back_populates="message")
    sender = relationship("User")
    
class MessageRecipient(Base):
    __tablename__ = "message_recipients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enc_aes_key = Column(Text, nullable=False)

    is_read : Mapped[bool] = mapped_column(Boolean, default=False)

    message = relationship("Message", back_populates="recipients")
    recipient = relationship("User")
