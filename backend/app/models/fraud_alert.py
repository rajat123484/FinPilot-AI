from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    merchant = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    date = Column(String(50), nullable=False)
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_level = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH
    rules_triggered = Column(Text, nullable=False) # JSON list of rules violated
    ai_explanation = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, REVIEWED, DISMISSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="fraud_alerts")
    transaction = relationship("Transaction", back_populates="fraud_alert")
