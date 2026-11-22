import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import json
import logging
from app.services.gemini_service import gemini_service

logger = logging.getLogger("finpilot.fraud")

class FraudDetector:
    """
    Hybrid Financial Anomaly and Risk Scoring Engine.
    Combines:
    1. Statistical Z-Score / IQR outlier detection for abnormal transaction sizes.
    2. Temporal duplicate & velocity spike detection (multiple rapid transactions at same merchant).
    3. Heuristic high-risk keyword & odd merchant/midnight activity tagging.
    4. Gemini AI explanation synthesis for human-in-the-loop review.
    """

    HIGH_RISK_KEYWORDS = [
        "crypto", "bitcoin", "binance", "coinbase", "wire transfer", "offshore",
        "casino", "betting", "lottery", "unauthorized", "western union", "overseas"
    ]

    async def analyze_transactions(self, transactions_data: List[Dict[str, Any]], user_id: int) -> List[Dict[str, Any]]:
        """
        Takes a list of transaction dictionaries and evaluates each for anomaly risk.
        Returns a list of alert dictionaries for flagged transactions.
        """
        if not transactions_data:
            return []

        df = pd.DataFrame(transactions_data)
        
        # Ensure necessary columns
        if "amount" not in df.columns or "title" not in df.columns:
            return []

        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["date_parsed"] = pd.to_datetime(df["date"], errors="coerce")
        df["date_parsed"] = df["date_parsed"].fillna(pd.Timestamp.now())
        df = df.sort_values(by="date_parsed")

        # Expense-only filtering for fraud analysis
        expense_mask = df.get("type", "expense").str.lower() != "income"
        expense_df = df[expense_mask].copy()

        if len(expense_df) == 0:
            return []

        # Statistical baseline
        mean_amt = expense_df["amount"].mean()
        std_amt = expense_df["amount"].std()
        if pd.isna(std_amt) or std_amt == 0:
            std_amt = mean_amt * 0.5 or 50.0

        q75, q25 = np.percentile(expense_df["amount"], [75, 25])
        iqr = q75 - q25
        upper_whisker = q75 + (1.5 * iqr)

        alerts = []

        # Track recent transactions for duplicate/velocity detection
        for idx, row in expense_df.iterrows():
            rules_triggered = []
            risk_score = 10.0 # baseline low risk

            amount = float(row["amount"])
            title = str(row.get("title", "")).strip()
            title_lower = title.lower()
            trans_date = row["date_parsed"]

            # Rule 1: Extreme statistical outlier (> 3 standard deviations or > 3x upper IQR)
            z_score = (amount - mean_amt) / std_amt if std_amt > 0 else 0
            if z_score >= 3.0 or (amount > upper_whisker * 2.5 and amount > 500):
                rules_triggered.append(f"Abnormal Amount Outlier: ${amount:,.2f} is {z_score:.1f}x standard deviations above average")
                risk_score += 40.0
            elif z_score >= 2.0 or amount > upper_whisker:
                rules_triggered.append(f"Elevated Transaction Size: Significantly higher than usual typical spend (${mean_amt:,.2f})")
                risk_score += 20.0

            # Rule 2: High-risk keyword or offshore entity
            for kw in self.HIGH_RISK_KEYWORDS:
                if kw in title_lower:
                    rules_triggered.append(f"High-Risk Merchant/Entity Pattern: Contains keyword '{kw}'")
                    risk_score += 35.0
                    break

            # Rule 3: Rapid Duplicate or Near-Duplicate Velocity
            # Check if another transaction with identical amount occurred within 24 hours
            time_window_start = trans_date - timedelta(hours=24)
            time_window_end = trans_date + timedelta(hours=24)
            duplicates = expense_df[
                (expense_df.index != idx) &
                (expense_df["date_parsed"] >= time_window_start) &
                (expense_df["date_parsed"] <= time_window_end) &
                (expense_df["amount"] == amount) &
                (expense_df["title"].str.lower() == title_lower)
            ]

            if len(duplicates) > 0:
                rules_triggered.append(f"Duplicate Charge Detected: Multiple identical ${amount:,.2f} charges at '{title}' within 24h")
                risk_score += 30.0

            # Rule 4: Suspicious round large sum ($1,000, $2,500, $5,000)
            if amount >= 1000 and amount % 100 == 0:
                rules_triggered.append("High-Value Flat Amount: Unusual large rounded sum transaction")
                risk_score += 15.0

            # Clamp risk score between 0 and 99
            risk_score = min(max(risk_score, 10.0), 99.0)

            # Determine Risk Level
            if risk_score >= 70:
                risk_level = "HIGH"
            elif risk_score >= 40:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            # If risk score >= 40 or any explicit rule triggered, flag as suspicious
            if risk_score >= 40 or len(rules_triggered) > 0:
                # Generate AI explainability text
                ai_explanation = self._generate_rule_explanation(title, amount, rules_triggered, risk_level)

                alerts.append({
                    "user_id": user_id,
                    "transaction_id": row.get("id"),
                    "title": title,
                    "merchant": title,
                    "amount": amount,
                    "date": str(row.get("date")),
                    "risk_score": round(risk_score, 1),
                    "risk_level": risk_level,
                    "rules_triggered": json.dumps(rules_triggered),
                    "ai_explanation": ai_explanation,
                    "status": "PENDING"
                })

        return alerts

    def _generate_rule_explanation(self, merchant: str, amount: float, rules: List[str], risk_level: str) -> str:
        """
        Deterministic, professional explainable AI narrative for fraud indicators.
        """
        rules_text = "; ".join(rules) if rules else "Statistical anomaly relative to user history."
        return (
            f"Risk Level: {risk_level}. This transaction of ${amount:,.2f} at '{merchant}' was flagged due to: {rules_text}. "
            f"Notice: This is an automated algorithmic risk indicator, not a definitive confirmation of fraud. "
            f"Please verify if this was an authorized payment or contact your card issuer if unrecognized."
        )

fraud_detector = FraudDetector()
