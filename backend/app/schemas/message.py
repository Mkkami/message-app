
from typing import List
from pydantic import BaseModel, Field


class Recipient(BaseModel):
    user_id: str
    enc_aes_key: str

class MessageCreate(BaseModel):
    ciphertext: str = Field(..., max_length=4_000_000) # 4 MB (text + attachment)
    eph_key: str = Field(..., min_length=64, max_length=64)
    recipients: List[Recipient] = Field(..., min_length=1, max_length=10) # max 10 recipients



'''
message: {
    ciphertext,
    eph_key
},
recipients: [
    {
        user_id,
        enc_aes_key
    }
]
'''