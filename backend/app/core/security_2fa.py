from os import urandom
from app.core.settings import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MASTER_KEY = settings.TOTP_SECRET_KEY
master_key = bytes.fromhex(MASTER_KEY)
aesgcm = AESGCM(master_key)

def encrypt_2fa_key(plain_text: str) -> str:
    nonce = urandom(12)
    cipher_text = aesgcm.encrypt(nonce, plain_text.encode(), None)

    return (nonce + cipher_text).hex()

def decrypt_2fa_key(encrypted_text: str) -> str:
    combined = bytes.fromhex(encrypted_text)
    nonce = combined[:12]
    cipher_text = combined[12:]

    decrypted = aesgcm.decrypt(nonce, cipher_text, None)

    return decrypted.decode()
