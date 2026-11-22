from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.upload import (
    ParsePreviewResponse,
    CommitUploadRequest,
    CommitUploadResponse
)
from app.services.csv_parser import transaction_parser
from app.services.fraud_detector import fraud_detector

router = APIRouter(prefix="/upload", tags=["Bank SMS / CSV Analyzer"])

@router.post("/csv", response_model=ParsePreviewResponse)
async def upload_csv_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content = await file.read()
    try:
        parsed_result = transaction_parser.parse_csv_bytes(content)
        return parsed_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sms", response_model=ParsePreviewResponse)
def parse_sms_text(
    sms_text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    if not sms_text.strip():
        raise HTTPException(status_code=400, detail="SMS content cannot be empty")

    parsed_result = transaction_parser.parse_sms_text(sms_text)
    return parsed_result

@router.post("/commit", response_model=CommitUploadResponse)
async def commit_parsed_transactions(
    payload: CommitUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="No transactions provided to import")

    # Prepare for fraud detection
    tx_dicts = []
    for item in payload.transactions:
        tx_dicts.append({
            "title": item.title,
            "amount": item.amount,
            "type": item.type,
            "category": item.category,
            "date": item.date
        })

    # Screen incoming transactions for potential anomalies
    detected_alerts = await fraud_detector.analyze_transactions(tx_dicts, current_user.id)
    flagged_titles_and_amts = {(a["title"], a["amount"]) for a in detected_alerts}

    imported_count = 0
    flagged_count = 0

    for item in payload.transactions:
        is_flagged = (item.title, item.amount) in flagged_titles_and_amts
        if is_flagged:
            flagged_count += 1

        try:
            d_obj = datetime.strptime(item.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            d_obj = datetime.now(timezone.utc)

        new_t = Transaction(
            user_id=current_user.id,
            title=item.title,
            amount=item.amount,
            type=item.type,
            category=item.category,
            date=d_obj,
            payment_method=item.payment_method,
            is_flagged=is_flagged,
            risk_score=65.0 if is_flagged else 10.0,
            risk_level="MEDIUM" if is_flagged else "LOW",
            source="csv_import"
        )
        db.add(new_t)
        imported_count += 1

    db.commit()

    return CommitUploadResponse(
        imported_count=imported_count,
        flagged_fraud_count=flagged_count,
        message=f"Successfully imported {imported_count} transactions ({flagged_count} flagged for risk review)"
    )
