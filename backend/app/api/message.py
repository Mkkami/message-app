

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.message import Message, MessageRecipient
from app.schemas.message import MessageCreate


router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)


@router.post("/send")
def send_message(
    message: MessageCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # check if auth
    current_user_id = request.session.get("user_id")
    if not current_user_id or not request.session.get("2fa_verified"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # create message
    new_message = Message(
        sender_id=current_user_id,
        ciphertext=message.ciphertext,
        signature=message.signature,
        eph_key=message.eph_key
    )
    db.add(new_message)
    db.flush()

    for rec in message.recipients:
        new_recipient = MessageRecipient(
            message_id=new_message.id,
            recipient_id=rec.recipient_id,
            enc_aes_key=rec.enc_aes_key
        )
        db.add(new_recipient)

    db.commit()
    return {
        "status": "sent",
        "message_id": new_message.id
    }

@router.get("/inbox")
def get_inbox(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = request.session.get("user_id")
    if not current_user_id or not request.session.get("2fa_verified"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    inbox_entries = (
        db.query(MessageRecipient)
        .filter(MessageRecipient.recipient_id == current_user_id)
        .all()
    )

    return [
        {
            "id": ent.message_id,
            "sender_username": ent.message.sender.username,
            "is_read": ent.is_read
        }
        for ent in inbox_entries
    ]

@router.get("/{message_id}")
def get_message(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = request.session.get("user_id")
    if not current_user_id or not request.session.get("2fa_verified"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    message_recipient = (
        db.query(MessageRecipient)
        .filter(
            MessageRecipient.message_id == message_id,
            MessageRecipient.recipient_id == current_user_id
        )
        .first()
    )

    if not message_recipient:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message_recipient.is_read == False:
        message_recipient.is_read = True
        db.commit()
    
    message = message_recipient.message

    return {
        "sender_id": message.sender_id,
        "ciphertext": message.ciphertext,
        "signature": message.signature,
        "eph_key": message.eph_key,
        "enc_aes_key": message_recipient.enc_aes_key
    }