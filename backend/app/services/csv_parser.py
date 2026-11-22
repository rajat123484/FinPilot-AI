import io
import re
import csv
import pandas as pd
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

CATEGORY_RULES = {
    "Food": ["starbucks", "mcdonalds", "subway", "uber eats", "doordash", "grocery", "supermarket", "walmart", "whole foods", "cafe", "restaurant", "dining", "pizza", "burger", "chipotle", "kroger"],
    "Shopping": ["amazon", "ebay", "target", "apple store", "best buy", "clothing", "zara", "nike", "adidas", "ikea", "aliexpress", "mall", "electronics"],
    "Travel": ["uber", "lyft", "delta", "american airlines", "united", "airbnb", "hotel", "flight", "taxi", "gas", "shell", "chevron", "train", "amtrak", "subway metro"],
    "Education": ["udemy", "coursera", "book", "university", "college", "tuition", "course", "chegg", "school", "library"],
    "Bills": ["electric", "water bill", "att", "verizon", "t-mobile", "internet", "comcast", "rent", "insurance", "geico", "utility", "lease"],
    "Entertainment": ["netflix", "spotify", "hulu", "disney", "cinema", "movie", "amc", "steam", "playstation", "xbox", "hbo", "concert"],
    "Healthcare": ["pharmacy", "cvs", "walgreens", "hospital", "clinic", "dental", "doctor", "medicine", "health", "optometry"],
    "Salary": ["payroll", "direct deposit", "salary", "employer", "bonus", "stipend", "wages"],
    "Investments": ["vanguard", "fidelity", "robinhood", "charles schwab", "dividend", "interest earned", "crypto", "treasury"]
}

class TransactionParser:

    def auto_categorize(self, text: str, default_type: str = "expense") -> Tuple[str, str, float]:
        """
        Infers category, transaction type, and categorization confidence from merchant title.
        Returns: (category, type, confidence)
        """
        text_lower = text.lower()

        # Check salary / income first
        for kw in CATEGORY_RULES["Salary"]:
            if kw in text_lower:
                return "Salary", "income", 0.95

        for kw in CATEGORY_RULES["Investments"]:
            if kw in text_lower:
                t = "income" if any(w in text_lower for w in ["dividend", "interest", "return"]) else "expense"
                return "Investments", t, 0.90

        for cat, keywords in CATEGORY_RULES.items():
            if cat in ["Salary", "Investments"]:
                continue
            for kw in keywords:
                if kw in text_lower:
                    return cat, "expense", 0.92

        return "Miscellaneous", default_type, 0.60

    def parse_csv_bytes(self, file_bytes: bytes) -> Dict[str, Any]:
        """
        Parses CSV data with dynamic header mapping:
        Handles various column headers like Date, Title/Description/Merchant, Amount, Type/Category.
        """
        try:
            # Try reading with pandas
            stream = io.BytesIO(file_bytes)
            df = pd.read_csv(stream)
        except Exception:
            try:
                stream = io.StringIO(file_bytes.decode('utf-8', errors='replace'))
                df = pd.read_csv(stream)
            except Exception as e:
                raise ValueError(f"Unable to parse CSV file: {str(e)}")

        # Normalize column headers
        col_map = {}
        for col in df.columns:
            c = str(col).strip().lower()
            if any(k in c for k in ["date", "time", "timestamp"]):
                col_map["date"] = col
            elif any(k in c for k in ["desc", "title", "merchant", "payee", "name", "particulars"]):
                col_map["title"] = col
            elif any(k in c for k in ["amount", "value", "cost", "sum"]):
                col_map["amount"] = col
            elif any(k in c for k in ["category", "tag"]):
                col_map["category"] = col
            elif any(k in c for k in ["type", "dr/cr", "credit/debit"]):
                col_map["type"] = col

        if "amount" not in col_map:
            raise ValueError("CSV must contain an 'amount' column (e.g. Amount, Value, Cost)")

        parsed_items = []
        total_income = 0.0
        total_expense = 0.0
        categories_found = set()

        for idx, row in df.iterrows():
            raw_title = str(row[col_map.get("title")]).strip() if "title" in col_map else f"Transaction #{idx+1}"
            raw_amt_str = str(row[col_map["amount"]]).replace("$", "").replace(",", "").strip()
            
            try:
                amt = abs(float(raw_amt_str))
            except ValueError:
                continue

            # Determine type
            inferred_type = "expense"
            if "type" in col_map:
                t_val = str(row[col_map["type"]]).strip().lower()
                if any(w in t_val for w in ["income", "credit", "cr", "deposit"]):
                    inferred_type = "income"
                else:
                    inferred_type = "expense"
            elif any(w in raw_title.lower() for w in ["salary", "payroll", "dividend", "refund"]):
                inferred_type = "income"

            # Category
            if "category" in col_map and str(row[col_map["category"]]).strip() and str(row[col_map["category"]]).strip() != "nan":
                cat = str(row[col_map["category"]]).strip().title()
                confidence = 0.99
            else:
                cat, cat_type, confidence = self.auto_categorize(raw_title, inferred_type)
                if cat == "Salary":
                    inferred_type = "income"

            # Date
            raw_date = str(row[col_map.get("date")]) if "date" in col_map else datetime.now(timezone.utc).strftime("%Y-%m-%d")
            try:
                date_obj = pd.to_datetime(raw_date, errors="coerce")
                if pd.isna(date_obj):
                    formatted_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                else:
                    formatted_date = date_obj.strftime("%Y-%m-%d")
            except Exception:
                formatted_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            if inferred_type == "income":
                total_income += amt
            else:
                total_expense += amt

            categories_found.add(cat)

            potential_risk = None
            if amt > 2500 and inferred_type == "expense":
                potential_risk = f"High Amount Flag (${amt:,.2f})"

            parsed_items.append({
                "index": idx,
                "title": raw_title,
                "amount": round(amt, 2),
                "type": inferred_type,
                "category": cat,
                "date": formatted_date,
                "payment_method": "Card" if inferred_type == "expense" else "Bank Transfer",
                "confidence": confidence,
                "potential_risk": potential_risk
            })

        return {
            "total_parsed": len(parsed_items),
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "detected_categories": list(categories_found),
            "transactions": parsed_items
        }

    def parse_sms_text(self, text: str) -> Dict[str, Any]:
        """
        Parses common bank SMS notification formats like:
        'Alert: USD 45.50 spent on your Card at STARBUCKS on 2026-11-18. Avl Bal: USD 3,420.'
        'Acct XX1234 credited with INR 75,000.00 on 01-Nov-2026 by SALARY.'
        """
        lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
        parsed_items = []
        total_income = 0.0
        total_expense = 0.0
        categories_found = set()

        for idx, line in enumerate(lines):
            # Regex for amounts
            amt_match = re.search(r'(?:USD|INR|EUR|GBP|Rs\.?|\$|€|£)\s*([\d,]+\.?\d*)', line, re.IGNORECASE)
            if not amt_match:
                amt_match = re.search(r'(?:spent|debited|credited|paid|withdrawn|transferred)\s+(?:for\s+)?([\d,]+\.?\d*)', line, re.IGNORECASE)

            if not amt_match:
                continue

            try:
                amt_str = amt_match.group(1).replace(",", "")
                amt = float(amt_str)
            except ValueError:
                continue

            is_credit = bool(re.search(r'\b(credited|received|deposit|deposited|refund)\b', line, re.IGNORECASE))
            t_type = "income" if is_credit else "expense"

            # Extract merchant/title
            merchant = "Bank Transaction"
            merchant_match = re.search(r'\b(?:at|to|by|info:?)\s+([A-Za-z0-9\s\.\-_&]{2,30}?)(?:\s+(?:on|avl|ref|card|via|\.|$))', line, re.IGNORECASE)
            if merchant_match:
                merchant = merchant_match.group(1).strip()
            else:
                merchant = "Card Payment" if t_type == "expense" else "Bank Credit"

            cat, _, conf = self.auto_categorize(merchant if merchant != "Card Payment" else line, t_type)

            formatted_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            if t_type == "income":
                total_income += amt
            else:
                total_expense += amt

            categories_found.add(cat)

            parsed_items.append({
                "index": idx,
                "title": merchant,
                "amount": round(amt, 2),
                "type": t_type,
                "category": cat,
                "date": formatted_date,
                "payment_method": "Bank Transfer" if is_credit else "UPI / Card",
                "confidence": conf,
                "potential_risk": f"Large Outflow (${amt:,.2f})" if amt > 2000 and t_type == "expense" else None
            })

        return {
            "total_parsed": len(parsed_items),
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "detected_categories": list(categories_found),
            "transactions": parsed_items
        }

transaction_parser = TransactionParser()
