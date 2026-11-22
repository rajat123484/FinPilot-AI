from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ParsedTransactionItem(BaseModel):
    index: int
    title: str
    amount: float
    type: str # income or expense
    category: str
    date: str
    payment_method: str
    confidence: float # 0.0 - 1.0 category confidence
    potential_risk: Optional[str] = None

class ParsePreviewResponse(BaseModel):
    total_parsed: int
    total_income: float
    total_expense: float
    detected_categories: List[str]
    transactions: List[ParsedTransactionItem]

class CommitUploadRequest(BaseModel):
    transactions: List[ParsedTransactionItem]

class CommitUploadResponse(BaseModel):
    imported_count: int
    flagged_fraud_count: int
    message: str
