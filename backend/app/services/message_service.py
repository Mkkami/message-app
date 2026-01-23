from sqlalchemy.orm import Session
from app.schemas.message import MessageCreate
from app.models.message import Message, MessageRecipient

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def send_message(self, sender_id: int, msg_data: MessageCreate):
        new_message = Message(
            sender_id=sender_id,
            ciphertext=msg_data.ciphertext,
            signature=msg_data.signature,
            eph_key=msg_data.eph_key
        )
        self.db.add(new_message)
        self.db.flush()

        for rec in msg_data.recipients:
            new_recipient = MessageRecipient(
                message_id=new_message.id,
                recipient_id=rec.recipient_id,
                enc_aes_key=rec.enc_aes_key
            )
            self.db.add(new_recipient)
        self.db.commit()
        return new_message.id
    
    def get_user_inbox(self, user_id: int):
        return (
            self.db.query(MessageRecipient)
            .filter(MessageRecipient.recipient_id == user_id)
            .all()
        )
    
    def get_message_by_id(self, message_id: str, user_id: int):
        entry = self.db.query(MessageRecipient).filter(
            MessageRecipient.message_id == message_id,
            MessageRecipient.recipient_id == user_id
        ).first()

        if entry and not entry.is_read:
            entry.is_read = True
            self.db.commit()
        return entry
    
    def delete_message(self, message_id: str, user_id: int):
        entry = self.db.query(MessageRecipient).filter(
            MessageRecipient.message_id == message_id,
            MessageRecipient.recipient_id == user_id
        ).first()

        if entry:
            self.db.delete(entry)
            self.db.commit()

            # sprzątanie wiadomości jeśli nie ma już odbiorców
            remaining = self.db.query(MessageRecipient).filter(
                MessageRecipient.message_id == entry.message_id
            ).count()

            if remaining == 0:
                original_msg = self.db.query(Message).filter(Message.id == entry.message_id).first()
                if original_msg:
                    self.db.delete(original_msg)
                    self.db.commit()
            return True
        return False