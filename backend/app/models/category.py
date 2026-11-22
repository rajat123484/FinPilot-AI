from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    icon = Column(String(50), default="HelpCircle")
    color = Column(String(20), default="#38BDF8")
    type = Column(String(20), default="expense") # expense, income
    is_default = Column(Boolean, default=True)
