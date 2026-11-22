import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.schemas.fraud import FraudAlertResponse, FraudOverviewResponse
from app.services.fraud_detector import fraud_detector
from app.services.csv_parser import transaction_parser

router = APIRouter(prefix="/fraud", tags=["Fraud & Anomaly Detection"])

@router.get("/overview", response_model=FraudOverviewResponse)
def get_fraud_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_tx = db.query(Transaction).filter(Transaction.user_id == current_user.id).count()

    alerts_query = db.query(FraudAlert).filter(
        FraudAlert.user_id == current_user.id
    ).order_by(desc(FraudAlert.created_at))

    alerts = alerts_query.all()
    pending_alerts = [a for a in alerts if a.status == "PENDING"]

    high_risk = sum(1 for a in pending_alerts if a.risk_level == "HIGH")
    med_risk = sum(1 for a in pending_alerts if a.risk_level == "MEDIUM")
    low_risk = sum(1 for a in pending_alerts if a.risk_level == "LOW")

    # Financial health score: 100 base, penalized by pending risks
    health_score = max(100.0 - (high_risk * 15.0) - (med_risk * 7.0) - (low_risk * 2.0), 20.0)

    # Format alerts
    alert_responses = []
    for a in alerts:
        try:
            rules = json.loads(a.rules_triggered) if a.rules_triggered.startswith("[") else [a.rules_triggered]
        except Exception:
            rules = [a.rules_triggered]

        alert_responses.append(FraudAlertResponse(
            id=a.id,
            user_id=a.user_id,
            transaction_id=a.transaction_id,
            title=a.title,
            merchant=a.merchant,
            amount=a.amount,
            date=a.date,
            risk_score=a.risk_score,
            risk_level=a.risk_level,
            rules_triggered=rules,
            ai_explanation=a.ai_explanation,
            status=a.status,
            created_at=a.created_at
        ))

    return FraudOverviewResponse(
        total_analyzed=total_tx,
        flagged_count=len(pending_alerts),
        high_risk_count=high_risk,
        medium_risk_count=med_risk,
        low_risk_count=low_risk,
        overall_health_score=round(health_score, 1),
        alerts=alert_responses
    )

@router.post("/scan-now", response_model=FraudOverviewResponse)
async def scan_user_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Runs full statistical & velocity anomaly detection across all user transactions
    and regenerates fraud alerts.
    """
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()

    tx_dicts = [{
        "id": t.id,
        "title": t.title,
        "amount": t.amount,
        "type": t.type,
        "date": t.date.isoformat(),
        "category": t.category
    } for t in transactions]

    detected_alerts = await fraud_detector.analyze_transactions(tx_dicts, current_user.id)

    # Update transactions and insert alerts
    for a in detected_alerts:
        t_id = a.get("transaction_id")
        if t_id:
            tx = db.query(Transaction).filter(Transaction.id == t_id).first()
            if tx:
                tx.is_flagged = True
                tx.risk_score = a["risk_score"]
                tx.risk_level = a["risk_level"]

            # Check if alert already exists
            existing_alert = db.query(FraudAlert).filter(
                FraudAlert.transaction_id == t_id,
                FraudAlert.user_id == current_user.id
            ).first()

            if not existing_alert:
                db.add(FraudAlert(**a))

    db.commit()
    return get_fraud_overview(db, current_user)

@router.post("/resolve/{alert_id}")
def resolve_fraud_alert(
    alert_id: int,
    action: str = "REVIEWED", # "REVIEWED" or "DISMISSED"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(FraudAlert).filter(
        FraudAlert.id == alert_id,
        FraudAlert.user_id == current_user.id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = action.upper()
    
    # If dismissed or verified, update transaction flag
    if alert.transaction_id:
        tx = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
        if tx and action.upper() == "DISMISSED":
            tx.is_flagged = False

    db.commit()
    return {"message": f"Alert marked as {action.upper()}"}

@router.post("/analyze-file")
async def analyze_uploaded_csv_for_fraud(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Directly scans an uploaded CSV file for anomalies and suspicious patterns
    without forcing a commit to the ledger, returning a complete risk report.
    """
    contents = await file.read()
    try:
        parsed = transaction_parser.parse_csv_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    transactions = parsed["transactions"]
    detected_alerts = await fraud_detector.analyze_transactions(transactions, current_user.id)

    # Format alerts with clean rule lists
    formatted_alerts = []
    for a in detected_alerts:
        try:
            rules = json.loads(a["rules_triggered"])
        except Exception:
            rules = [a["rules_triggered"]]
        formatted_alerts.append({
            "title": a["title"],
            "amount": a["amount"],
            "date": a["date"],
            "risk_score": a["risk_score"],
            "risk_level": a["risk_level"],
            "rules_triggered": rules,
            "ai_explanation": a["ai_explanation"]
        })

    return {
        "file_name": file.filename,
        "total_scanned": len(transactions),
        "anomalies_detected": len(detected_alerts),
        "high_risk_count": sum(1 for a in detected_alerts if a["risk_level"] == "HIGH"),
        "medium_risk_count": sum(1 for a in detected_alerts if a["risk_level"] == "MEDIUM"),
        "flagged_transactions": formatted_alerts
    }
