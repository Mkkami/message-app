from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.user import User, UserKeys
from app.schemas.user import UserCreate
from zxcvbn import zxcvbn

from app.exceptions.weak_password_exception import WeakPasswordException

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class UserService:

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user: UserCreate):
        if self.get_user_by_username(user.username):
            raise ValueError("Username already exists")
        
        passwd_validate = zxcvbn(user.password)

        if passwd_validate['score'] < 3:
            raise WeakPasswordException(passwd_validate['feedback'])

        hashed_password = pwd_context.hash(user.password)

        new_user = User(
            username=user.username,
            password_hash=hashed_password
        )

        self.db.add(new_user)
        self.db.flush() # to get user id

        new_keys = UserKeys(
            user_id = new_user.id,
            signing_pub_key = user.keys.signing_pub_key,
            encryption_pub_key = user.keys.encryption_pub_key,
            signing_priv_key = user.keys.signing_priv_key,
            encryption_priv_key = user.keys.encryption_priv_key,
            signing_priv_iv = user.keys.signing_priv_iv,
            encryption_priv_iv = user.keys.encryption_priv_iv,
            key_salt = user.keys.key_salt
        )

        self.db.add(new_keys)
        self.db.commit()
        self.db.refresh(new_user)

        return new_user

    def get_user_by_username(self, username: str):
        return self.db.query(User).filter(User.username == username).first()
