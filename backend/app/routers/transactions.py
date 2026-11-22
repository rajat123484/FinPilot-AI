import csv
import io
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse
)
from app.services.fraud_detector import fraud_detector

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    is_flagged: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter((Transaction.title.ilike(search_filter)) | (Transaction.notes.ilike(search_filter)))

    if category and category != "All":
        query = query.filter(Transaction.category == category)

    if type and type != "all":
        query = query.filter(Transaction.type == type.lower())

    if is_flagged is not None:
        query = query.filter(Transaction.is_flagged == is_flagged)

    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(Transaction.date >= s_dt)
        except Exception:
            pass

    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(Transaction.date <= e_dt)
        except Exception:
            pass

    total = query.count()
    transactions = query.order_by(desc(Transaction.date)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "transactions": transactions
    }

@router.post("", response_model=TransactionResponse)
async def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx_date = tx_in.date
    if tx_date.tzinfo is None:
        tx_date = tx_date.replace(tzinfo=timezone.utc)

    # Statistical screening for anomaly
    is_flagged = False
    risk_score = 15.0
    risk_level = "LOW"

    if tx_in.type == "expense":
        # Check against recent expenses
        recent = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense"
        ).all()

        recent_dicts = [{
            "id": r.id,
            "title": r.title,
            "amount": r.amount,
            "type": r.type,
            "date": r.date.isoformat()
        } for r in recent]

        new_dict = {
            "id": 999999,
            "title": tx_in.title,
            "amount": tx_in.amount,
            "type": tx_in.type,
            "date": tx_date.isoformat()
        }

        alerts = await fraud_detector.analyze_transactions(recent_dicts + [new_dict], current_user.id)
        # Find if our new transaction is flagged
        for a in alerts:
            if a.get("title") == tx_in.title and a.get("amount") == tx_in.amount:
                is_flagged = True
                risk_score = a.get("risk_score", 50.0)
                risk_level = a.get("risk_level", "MEDIUM")
                break

    new_tx = Transaction(
        user_id=current_user.id,
        title=tx_in.title,
        amount=tx_in.amount,
        type=tx_in.type,
        category=tx_in.category or "Miscellaneous",
        date=tx_date,
        payment_method=tx_in.payment_method or "Card",
        notes=tx_in.notes,
        is_flagged=is_flagged,
        risk_score=risk_score,
        risk_level=risk_level,
        source="manual"
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/{id}", response_model=TransactionResponse)
def get_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(
    id: int,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = tx_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{id}")
def delete_transaction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully"}

@router.get("/export/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports all user transactions in clean standard CSV format.
    """
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(desc(Transaction.date)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Description", "Amount", "Type", "Category", "Payment Method", "Risk Score", "Flagged"])

    for t in transactions:
        writer.writerow([
            t.id,
            t.date.strftime("%Y-%m-%d"),
            t.title,
            t.amount,
            t.type,
            t.category,
            t.payment_method,
            t.risk_score,
            "Yes" if t.is_flagged else "No"
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=finpilot_transactions_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
