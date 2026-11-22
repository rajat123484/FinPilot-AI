from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False) # 'income' or 'expense'
    category = Column(String(50), nullable=False, default="Miscellaneous")
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    payment_method = Column(String(50), default="Card") # Card, Bank Transfer, UPI, Cash
    notes = Column(Text, nullable=True)
    
    # Anomaly / Fraud metadata
    is_flagged = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0) # 0-100
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    source = Column(String(50), default="manual") # manual, csv_import, sms_sync
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="transactions")
    fraud_alert = relationship("FraudAlert", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
