
import pyotp

from app.core.security_2fa import decrypt_2fa_key, encrypt_2fa_key
from app.models.user import User
from sqlalchemy.orm import Session

from app.exceptions.totp_errors import InvalidTotpTokenError, TotpAlreadyEnabledError

class TotpService:

    def generate_secret(self) -> str:
        return pyotp.random_base32()
    
    def get_totp_uri(self, secret: str, username: str):
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=username,
            issuer_name="SecureMsgApp"
        )
    
    def verify_token(self, secret: str, token: str) -> bool:
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)


    def verify_and_activate(self, db: Session, user: User, raw_secret: str, token: str):
        if user.is_2fa_enabled:
            raise TotpAlreadyEnabledError()
        
        if not self.verify_token(raw_secret, token):
            raise InvalidTotpTokenError()
        
        user.totp_secret = encrypt_2fa_key(raw_secret)
        user.is_2fa_enabled = True
        db.commit()

    def verify_existing_token(self, user: User, token: str):
        if not user.totp_secret:
            raise InvalidTotpTokenError()
        
        decrypted = decrypt_2fa_key(user.totp_secret)
        if not self.verify_token(decrypted, token):
            raise InvalidTotpTokenError()
        
        return True
