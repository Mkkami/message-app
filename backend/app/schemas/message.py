
from typing import List
from pydantic import BaseModel, Field


class Recipient(BaseModel):
    recipient_id: int
    enc_aes_key: str

class MessageCreate(BaseModel):
    ciphertext: str = Field(..., max_length=4_000_000) # 4 MB (text + attachment)
    signature: str = Field(..., min_length=128, max_length=128)
    eph_key: str = Field(..., min_length=64, max_length=64)
    recipients: List[Recipient] = Field(..., min_length=1, max_length=10) # max 10 recipients



'''
message: {
    ciphertext,
    signature,
    eph_key
},
recipients: [
    {
        recipient_id,
        enc_aes_key
    }
]
'''