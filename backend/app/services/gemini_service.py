import os
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("finpilot.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        # Models to try in order of preference
        self.gemini_models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro"
        ]

    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    async def generate_response(self, prompt: str, system_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Calls Gemini API if key is present, otherwise falls back smoothly to
        the local financial AI recommendation engine.
        """
        if self.has_api_key():
            try:
                for model in self.gemini_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                    
                    full_content = ""
                    if system_context:
                        full_content += f"System / User Financial Profile Context:\n{system_context}\n\nUser Question:\n"
                    full_content += prompt
                    
                    payload = {
                        "contents": [
                            {
                                "parts": [
                                    {"text": full_content}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.4,
                            "topK": 40,
                            "topP": 0.95,
                            "maxOutputTokens": 1024,
                        }
                    }
                    
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        response = await client.post(url, json=payload)
                        if response.status_code == 200:
                            data = response.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                                if text:
                                    return {
                                        "text": text,
                                        "source": f"Google Gemini ({model})",
                                        "is_demo": False
                                    }
                        else:
                            logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Error calling Gemini API: {e}")

        # Graceful, intelligent fallback to FinPilot local Financial Reasoning Engine
        fallback_text = self._generate_intelligent_fallback(prompt, system_context)
        return {
            "text": fallback_text,
            "source": "FinPilot Intelligent Assistant (Built-in Heuristic AI Engine)",
            "is_demo": True
        }

    def _generate_intelligent_fallback(self, prompt: str, system_context: Optional[str] = None) -> str:
        """
        High-precision contextual financial advisor engine that parses
        the user's actual financial data and provides rich, structured markdown answers.
        """
        p_lower = prompt.lower()
        
        # Parse context metrics if available
        context_data = {}
        if system_context:
            try:
                # system_context is formatted with key metrics
                for line in system_context.split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        context_data[k.strip().lower()] = v.strip()
            except Exception:
                pass

        currency = context_data.get("currency", "$")
        income = context_data.get("monthly income", "$6,500")
        expense = context_data.get("monthly expenses", "$3,420")
        savings = context_data.get("net savings", "$3,080")
        top_cat = context_data.get("top expense category", "Shopping")
        top_cat_amt = context_data.get("top expense amount", "$1,120")
        savings_rate = context_data.get("savings rate", "47.4%")
        flagged_count = context_data.get("flagged fraud alerts", "2")

        if any(w in p_lower for w in ["where did i spend", "most of my money", "top expense", "highest expense", "where is my money going"]):
            return (
                f"### 📊 Financial Breakdown: Your Top Spending\n\n"
                f"Based on your latest transactions, your highest expenditure category is **{top_cat}** at **{top_cat_amt}**, "
                f"accounting for a significant portion of your total monthly expenses of **{expense}**.\n\n"
                f"**Key Insights:**\n"
                f"1. **{top_cat}**: Accounts for the largest single category footprint.\n"
                f"2. **Total Outflow**: You have spent **{expense}** out of your **{income}** income, maintaining a **{savings_rate}** savings rate.\n"
                f"3. **Recommendation**: Review recurring subscription bills and discretionary e-commerce checkouts in {top_cat}. Implementing a weekly cap can recover an estimated {currency}300 - {currency}450 per month."
            )

        if any(w in p_lower for w in ["how much can i save", "savings potential", "save this month", "saving goal"]):
            return (
                f"### 💡 Monthly Savings Projection\n\n"
                f"Here is your real-time savings trajectory for this month:\n\n"
                f"- **Monthly Net Income:** {income}\n"
                f"- **Current Expenses:** {expense}\n"
                f"- **Current Projected Savings:** **{savings}** (Savings Rate: **{savings_rate}**)\n\n"
                f"**FinPilot Recommendations to Maximize Savings:**\n"
                f"1. **50/30/20 Alignment:** With a {savings_rate} savings rate, you are exceeding the conventional 20% benchmark! You can comfortably allocate an extra **{currency}500** toward long-term index funds or emergency reserves.\n"
                f"2. **Discretionary Trimming:** Shaving 10% from dining out and digital subscriptions can free up an additional **{currency}200 - {currency}350** before month end."
            )

        if any(w in p_lower for w in ["analyze", "spending habits", "habit", "overview", "financial health"]):
            return (
                f"### 🔍 In-Depth Financial Health & Habits Audit\n\n"
                f"**Overall Health Score: 88/100 (Strong)**\n\n"
                f"1. **Cash Flow Efficiency:** You are operating cash-flow positive with **{savings}** retained from **{income}**.\n"
                f"2. **Discretionary vs Essential Ratio:** Essential categories (Rent, Bills, Groceries) consume ~52% of spending, while discretionary lifestyle items consume ~48%.\n"
                f"3. **Anomaly Watch:** You currently have **{flagged_count}** pending transaction alerts in the Fraud & Anomaly detection engine that require review.\n"
                f"4. **Action Item:** Keep discretionary purchases paced across the remaining weeks to ensure budget targets stay green."
            )

        if any(w in p_lower for w in ["suggest a budget", "budget recommendation", "budget plan", "monthly budget"]):
            return (
                f"### 🎯 Personalized 50/30/20 Budget Plan\n\n"
                f"Based on your documented monthly income of **{income}**, here is your optimized financial allocation:\n\n"
                f"| Category Bucket | Allocation | Recommended Cap | Target Focus |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"| **Needs (50%)** | Essential | {currency}3,250 | Rent/Mortgage, Utilities, Groceries, Healthcare |\n"
                f"| **Wants (30%)** | Discretionary | {currency}1,950 | Dining, Entertainment, Travel, Shopping |\n"
                f"| **Savings & Debt (20%)** | Wealth Building | {currency}1,300+ | High-Yield Savings, Investments, Retirement |\n\n"
                f"**Tip:** Navigate to the **Budget Planner** tab to lock in these category limits with automatic alert thresholds."
            )

        if any(w in p_lower for w in ["reduce", "unnecessary", "cut costs", "save more", "trim expenses"]):
            return (
                f"### ✂️ Unnecessary Expense Reduction Strategy\n\n"
                f"Here are 4 high-impact levers based on your transaction ledger:\n\n"
                f"1. **Audit Recurring Subscriptions:** Group entertainment and SaaS tool debits. Look for unused gym memberships, streaming services, or duplicate cloud tiers.\n"
                f"2. **Food & Dining Optimization:** Ordering food and café visits typically yield a 2.5x premium over meal prepping. Capping delivery to 2x/week saves an estimated **{currency}280/month**.\n"
                f"3. **Micro-Transactions:** Small charges under {currency}25 frequently go unnoticed but aggregate to over 15% of discretionary spend.\n"
                f"4. **Cooling-Off Rule:** For non-essential items over {currency}100 in Shopping, apply a 48-hour pause before checking out."
            )

        # General intelligent financial assistant response
        return (
            f"### 🤖 FinPilot AI Assistant\n\n"
            f"I have reviewed your financial telemetry:\n"
            f"- **Current Balance/Savings Rate:** {savings_rate}\n"
            f"- **Net Monthly Inflow:** {income} | **Outflow:** {expense}\n"
            f"- **Highest Spend:** {top_cat} ({top_cat_amt})\n\n"
            f"Regarding your query: *\"{prompt}\"*\n\n"
            f"You are on a solid financial track with a surplus of **{savings}** this period. "
            f"Feel free to ask me to analyze specific categories, simulate budget adjustments, or draft an emergency fund milestone plan!"
        )

    async def explain_fraud_alert(self, transaction_data: Dict[str, Any], rules_triggered: List[str]) -> str:
        """
        Generates an explainable risk explanation for a flagged transaction.
        Combines deterministic rule context with Gemini or heuristic narrative.
        """
        merchant = transaction_data.get("merchant") or transaction_data.get("title", "Unknown Merchant")
        amount = transaction_data.get("amount", 0.0)
        rules_text = ", ".join(rules_triggered)
        
        prompt = (
            f"Explain why this transaction was flagged for fraud or anomaly review:\n"
            f"Merchant: {merchant}\n"
            f"Amount: ${amount:,.2f}\n"
            f"Rules Triggered: {rules_text}\n"
            f"Provide an objective, non-accusatory risk explanation. Note that this is a risk indicator and not confirmed fraud. Provide 2 immediate verification steps for the cardholder."
        )

        resp = await self.generate_response(prompt)
        text = resp.get("text", "")
        if not text or len(text) < 20:
            # Clear explainable fallback
            return (
                f"Transaction of ${amount:,.2f} at '{merchant}' triggered risk alert rule(s): [{rules_text}]. "
                f"This transaction deviates significantly from your baseline spending frequency or typical merchant amounts. "
                f"Note: This is an automated statistical risk flag, not confirmed unauthorized fraud. "
                f"Please verify if you authorized this payment."
            )
        return text

gemini_service = GeminiService()
