from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, LargeBinary, String, func, func
from app.core.db import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))

    content = Column(LargeBinary)

    eph_pub_key = Column(String)
    
    created_at = Column(DateTime, server_default=func.now())
    
class MessageRecipient(Base):
    __tablename__ = "message_recipients"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    enc_aes_key = Column(String)
    is_read = Column(Boolean, default=False)
