from pydantic import BaseModel, Field


class TOTPVerify(BaseModel):
    token: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$") 