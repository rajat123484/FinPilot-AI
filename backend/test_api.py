import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_suite():
    print("==================================================")
    print("🚀 FINPILOT AI — COMPREHENSIVE AUTOMATED TEST SUITE")
    print("==================================================")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✅ 1. Health check: PASSED (Status: 200, service: FinPilot AI Backend)")

    # 2. Demo Login
    res = client.post("/api/auth/demo-login")
    assert res.status_code == 200, f"Demo login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    user = token_data["user"]
    assert token, "Token missing"
    assert user["email"] == "demo@finpilot.ai"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ 2. Demo Login: PASSED (User: {user['full_name']} <{user['email']}>)")

    # 3. Auth Me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    print(f"✅ 3. Auth Me Verification: PASSED (Currency: {res.json()['currency']})")

    # 4. Dashboard Summary
    res = client.get("/api/dashboard/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    kpis = summary["kpis"]
    print(f"✅ 4. Dashboard Summary: PASSED (Balance: ${kpis['total_balance']:,.2f}, Income: ${kpis['monthly_income']:,.2f}, Expenses: ${kpis['monthly_expenses']:,.2f}, Savings Rate: {kpis['savings_rate']}%)")
    assert len(summary["income_vs_expenses"]) > 0
    assert len(summary["category_spending"]) > 0

    # 5. Transactions List
    res = client.get("/api/transactions?page=1&page_size=10", headers=headers)
    assert res.status_code == 200
    tx_list = res.json()
    print(f"✅ 5. Transactions Listing: PASSED (Total records: {tx_list['total']}, Returned: {len(tx_list['transactions'])})")

    # 6. Create Transaction with Fraud Screening
    res = client.post("/api/transactions", headers=headers, json={
        "title": "Starbucks Coffee Test",
        "amount": 7.50,
        "type": "expense",
        "category": "Food",
        "date": "2026-11-18T10:00:00Z",
        "payment_method": "Card",
        "notes": "Automated test item"
    })
    assert res.status_code == 200
    new_tx = res.json()
    assert new_tx["title"] == "Starbucks Coffee Test"
    print(f"✅ 6. Transaction Creation & Screening: PASSED (ID: {new_tx['id']}, Amount: ${new_tx['amount']}, Risk: {new_tx['risk_level']})")

    # 7. Budgets Overview & AI recommendations
    res = client.get("/api/budgets", headers=headers)
    assert res.status_code == 200
    budgets = res.json()
    print(f"✅ 7. Budgets Overview: PASSED (Total Budget: ${budgets['total_budget']}, Categories: {len(budgets['categories'])})")

    res = client.get("/api/budgets/ai-recommendations", headers=headers)
    assert res.status_code == 200
    ai_b = res.json()
    assert len(ai_b["recommended_budgets"]) > 0
    print(f"✅ 8. AI 50/30/20 Budget Advisor: PASSED (Recommended Savings: ${ai_b['recommended_savings']})")

    # 8. AI Assistant Chat
    res = client.post("/api/ai/chat", headers=headers, json={
        "message": "Where did I spend most of my money this month?"
    })
    assert res.status_code == 200
    ai_chat = res.json()
    assert ai_chat["message"]
    print(f"✅ 9. AI Financial Assistant: PASSED (Source: {ai_chat['source']}, Length: {len(ai_chat['message'])} chars)")

    # 9. Fraud Detection Overview & Anomaly Scan
    res = client.get("/api/fraud/overview", headers=headers)
    assert res.status_code == 200
    fraud_overview = res.json()
    print(f"✅ 10. Fraud Overview: PASSED (Analyzed: {fraud_overview['total_analyzed']}, Flagged: {fraud_overview['flagged_count']}, Health Score: {fraud_overview['overall_health_score']}/100)")

    # 10. Financial Analytics Deep Dive
    res = client.get("/api/analytics/deep-dive", headers=headers)
    assert res.status_code == 200
    deep_dive = res.json()
    print(f"✅ 11. Deep-Dive Analytics: PASSED (Top Category: {deep_dive['top_spending_category']}, Daily Burn: ${deep_dive['daily_average_expense']})")

    # 11. CSV Upload Parser
    csv_path = os.path.join(os.path.dirname(__file__), "data", "sample_transactions.csv")
    with open(csv_path, "rb") as f:
        res = client.post("/api/upload/csv", headers=headers, files={"file": ("sample_transactions.csv", f, "text/csv")})
    assert res.status_code == 200
    parsed_csv = res.json()
    print(f"✅ 12. CSV File Analyzer: PASSED (Parsed: {parsed_csv['total_parsed']} records, Inflow: ${parsed_csv['total_income']}, Outflow: ${parsed_csv['total_expense']})")

    # 12. Bank SMS Parser
    sample_sms = "Alert: USD 84.50 spent on your Card at WHOLE FOODS MARKET on 2026-11-18. Avl Bal: USD 3,420."
    res = client.post("/api/upload/sms", headers=headers, json={"sms_text": sample_sms})
    assert res.status_code == 200
    sms_res = res.json()
    assert sms_res["total_parsed"] == 1
    print(f"✅ 13. Bank SMS Entity Extractor: PASSED (Parsed: {sms_res['transactions'][0]['title']}, Amount: ${sms_res['transactions'][0]['amount']}, Category: {sms_res['transactions'][0]['category']})")

    # 13. CSV Fraud Scanner on Suspicious Dataset
    suspicious_csv_path = os.path.join(os.path.dirname(__file__), "data", "suspicious_transactions.csv")
    with open(suspicious_csv_path, "rb") as f:
        res = client.post("/api/fraud/analyze-file", headers=headers, files={"file": ("suspicious_transactions.csv", f, "text/csv")})
    assert res.status_code == 200
    suspicious_analysis = res.json()
    assert suspicious_analysis["anomalies_detected"] > 0
    print(f"✅ 14. Suspicious Dataset Fraud Scanner: PASSED (Anomalies: {suspicious_analysis['anomalies_detected']}, High Risk: {suspicious_analysis['high_risk_count']})")

    # 14. Platform Settings
    res = client.get("/api/settings/status", headers=headers)
    assert res.status_code == 200
    settings_res = res.json()
    print(f"✅ 15. Settings & AI Status: PASSED (Engine: {settings_res['ai_engine']})")

    print("==================================================")
    print("🎉 ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_suite()
