from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.message import MessageCreate
from app.core.session import get_verified_user
from app.core.limit import limiter
from app.models.user import User
from app.services.message_service import MessageService

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)


@router.post("/send")
@limiter.limit("5/5 minute")
def send_message(
    message: MessageCreate,
    request: Request, # do limitera
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user)
):
    msg_service = MessageService(db)
    new_msg_id = msg_service.send_message(user.id, message)
    return {"status": "sent", "message_id": new_msg_id}


@router.get("/inbox")
def get_inbox(
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user)
):
    msg_service = MessageService(db)
    entries = msg_service.get_user_inbox(user.id)
    return [
        {
            "id": e.message_id,
            "sender_username": e.message.sender.username,
            "is_read": e.is_read
        }
        for e in entries
    ]


@router.get("/{message_id}")
def get_message(
    message_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user)
):
    service = MessageService(db)
    entry = service.get_message_by_id(message_id, user.id)

    if not entry:
        raise HTTPException(status_code=404, detail="Message not found")

    msg = entry.message

    return {
        "sender_id": msg.sender_id,
        "ciphertext": msg.ciphertext,
        "signature": msg.signature,
        "eph_key": msg.eph_key,
        "enc_aes_key": entry.enc_aes_key,
        "signature_pubkey": msg.sender.keys.signing_pub_key
    }

@router.delete("/{message_id}")
def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user)
):
    service = MessageService(db)

    if not service.delete_message(message_id, user.id):
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "deleted"}