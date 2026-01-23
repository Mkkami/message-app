from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.user import User, UserKeys
from app.schemas.user import UserCreate
from zxcvbn import zxcvbn

from app.exceptions.user_errors import UsernameAlreadyExistsError, WeakPasswordError

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class UserService:

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str):
        return self.db.query(User).filter(User.username == username).first()

    def create_user(self, user: UserCreate):
        if self.get_user_by_username(user.username):
            raise UsernameAlreadyExistsError()
        
        passwd_validate = zxcvbn(user.password)
        if passwd_validate['score'] < 3:
            raise WeakPasswordError(passwd_validate['feedback']['suggestions'][0] if passwd_validate['feedback']['suggestions'] else "The provided password is too weak.")

        hashed_password = pwd_context.hash(user.password)

        new_user = User(
            username=user.username,
            password_hash=hashed_password
        )

        self.db.add(new_user)
        self.db.flush() # to get user id

        # klucze prywatne szyfrowane we frontendzie
        new_keys = UserKeys(
            user_id = new_user.id,
            signing_pub_key = user.keys.signing_pub_key,
            encryption_pub_key = user.keys.encryption_pub_key,
            signing_priv_key = user.keys.signing_priv_key,
            encryption_priv_key = user.keys.encryption_priv_key,
            key_salt = user.keys.key_salt
        )

        self.db.add(new_keys)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user
    
    def validate_login(self, username: str, password: str) -> User | None:
        user = self.get_user_by_username(username)
        
        if user and pwd_context.verify(password, user.password_hash):
            return user
        return None
    