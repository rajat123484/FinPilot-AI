from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    message: str
    source: str # "gemini" or "finpilot_assistant"
    quick_suggestions: Optional[List[str]] = None

class QuickPrompt(BaseModel):
    id: str
    category: str
    prompt: str
