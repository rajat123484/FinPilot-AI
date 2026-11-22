# FinPilot AI — Intelligent Personal Financial Copilot

FinPilot AI is a production-grade, full-stack personal finance management web application. It combines autonomous wealth analytics, real-time transaction telemetry, a hybrid statistical & AI fraud sentinel, dynamic 50/30/20 budget planning, and conversational financial reasoning powered by Google Gemini (with an automatic offline AI fallback engine).

---

## 🚀 Key Features

### 1. Executive Dashboard
- **Real-Time KPIs**: Total liquid balance, monthly income inflow, monthly expenses, net savings, savings rate, and goal progress.
- **Interactive Multi-Month Charts**: 6-month historical Income vs. Expenses trajectory powered by Recharts.
- **Category Breakdown**: Dynamic donut chart showing proportional capital allocation across sectors.
- **Daily Spending Velocity**: Smooth area curves mapping spending acceleration.
- **Live Stream Activity**: Quick view of recent transactions with fraud risk tags.

### 2. Smart Expense Tracker & Ledger
- **CRUD Operations**: Record, view, edit, and delete transactions.
- **Multi-Factor Filtering**: Real-time search by merchant/notes, category dropdown, type toggle (income vs. expense), and flagged anomaly filters.
- **Statistical Screening**: Every new transaction is evaluated on-the-fly for statistical outlier anomalies before saving.
- **Export to CSV**: Instant one-click CSV export of all filtered ledger entries.

### 3. AI Financial Assistant (Powered by Google Gemini + Heuristic Fallback)
- **Natural Language Advisory**: Ask questions like:
  - *"Where did I spend most of my money this month?"*
  - *"How much can I realistically save this month?"*
  - *"Analyze my overall spending habits and financial health."*
  - *"Suggest an optimized 50/30/20 monthly budget for my income."*
  - *"How can I reduce unnecessary expenses and recurring subscriptions?"*
- **Context-Aware Telemetry**: The assistant injects your live income, actual category outflows, savings rates, and active fraud flags into the prompt for hyper-personalized answers.
- **Graceful Fallback**: If no Gemini API key is provided, the application runs on a built-in financial reasoning engine with zero crashes.

### 4. Fraud & Anomaly Sentinel
- **Statistical Outlier Detection (Z-Score & IQR)**: Flags purchases exceeding 3.0 standard deviations from your category baseline.
- **Temporal Duplicate & Velocity Detection**: Catches duplicate checkouts and rapid-fire charges at the same merchant within a 24-hour window.
- **Entity Risk Pattern Matching**: Highlights high-risk keywords (crypto wires, casinos, offshore gateways, abnormal round numbers).
- **Explainable AI Risk Audits**: Translates mathematical anomaly triggers into plain-English cardholder verification steps.
- **Direct CSV Scanner**: Drag-and-drop any transaction CSV to generate an instant risk audit report without saving to the ledger.

### 5. Smart 50/30/20 Budget Planner
- **Category Caps**: Set and edit limits for Food, Shopping, Travel, Bills, Entertainment, Healthcare, etc.
- **Threshold Warnings**: Visual progress bars transition across states:
  - 🟢 **SAFE** (< 70% used)
  - 🟡 **WARNING** (70% - 90% used)
  - 🟠 **CRITICAL** (90% - 100% used)
  - 🔴 **EXCEEDED** (> 100% used with exact overspend calculation)
- **AI 50/30/20 Allocation**: Automatically computes ideal Needs (50%), Wants (30%), and Savings (20%) targets based on your income, with a 1-click **"Apply AI Budget Caps"** action.

### 6. Financial Analytics & Audit Dossier
- **Macro Trends**: 6-month historical capital accumulation.
- **Deep-Dive Metrics**: Month-over-month spending velocity (%), average daily burn rate, and projected month-end outflow.
- **Ranked Portfolio Shares**: Full table of ranked category outflows with daily run rates.
- **Audit Dossier Export**: Generate and download a comprehensive JSON or printable PDF report.

### 7. Bank SMS & CSV Batch Analyzer
- **CSV Statement Ingestion**: Handles diverse column header variations (Date, Title, Amount, Category).
- **Bank SMS Parser**: Extracts transaction amounts, merchant entities, timestamps, and debit/credit status from raw notification SMS text.
- **Entity Categorization**: Automatically categorizes items with confidence percentage scores.
- **One-Click Ledger Import**: Ingests statements directly into the database while simultaneously running fraud screening.

### 8. Platform Settings & AI Engine Manager
- **Currency Switcher**: Seamlessly toggle between USD ($), EUR (€), INR (₹), GBP (£), CAD (C$), and JPY (¥).
- **Live Gemini API Key Tester**: Test and validate your Google Gemini API key with live model confirmation.
- **Factory Demo Reset**: Re-seed your database with 100+ pristine realistic transactions, budgets, and pre-calculated fraud anomalies.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Recharts 2, Lucide React |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Pandas, Uvicorn, Python-Multipart |
| **Database** | SQLite, SQLAlchemy 2.0 ORM |
| **Security** | PyJWT (HMAC-SHA256), Bcrypt password hashing |
| **AI Integration** | Google Gemini 1.5/2.0 API + Built-in Financial Heuristic Engine |

---

## 📁 Project Structure

```
FinPilot-AI/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database setup, JWT & password security
│   │   ├── models/         # SQLAlchemy models (User, Transaction, Budget, FraudAlert, Chat)
│   │   ├── schemas/        # Pydantic v2 request/response schemas
│   │   ├── services/       # Gemini AI, Fraud Detector, Analytics, CSV Parser, Seed Data
│   │   ├── routers/        # FastAPI route controllers (Auth, Dashboard, AI, Fraud, etc.)
│   │   └── main.py         # App factory, CORS, and table initialization
│   ├── data/
│   │   ├── sample_transactions.csv      # Clean 20-row test dataset
│   │   └── suspicious_transactions.csv  # Anomaly test dataset with duplicate & spike charges
│   ├── requirements.txt
│   ├── run.py              # Backend launcher script
│   ├── test_api.py         # Automated 15-test integration suite
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # StatCards, Sidebar, Navbar, Modal, Badge, Charts
│   │   ├── context/        # AuthContext with persistent JWT state
│   │   ├── pages/          # 8 core fintech application pages
│   │   ├── services/       # Unified API client with Bearer token injection
│   │   ├── App.jsx         # App router and master layout
│   │   ├── main.jsx
│   │   └── index.css       # Custom fintech navy design system
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── .gitignore
├── .env.example
└── README.md
```

---

## ⚡ Quickstart Guide

### Prerequisites
- **Python 3.10+** (Python 3.13 tested and verified)
- **Node.js 18+** and **npm**

---

### Step 1: Start the Backend API

1. Open a terminal in the project root:
   ```powershell
   cd backend
   ```

2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
   *(If creating a new virtual environment from scratch: `python -m venv venv`, then `pip install -r requirements.txt`)*

3. Run the backend server:
   ```powershell
   python run.py
   ```
   The backend API will start at **http://127.0.0.1:8000**.
   - Interactive Swagger API Documentation: **http://127.0.0.1:8000/docs**
   - Health Check: **http://127.0.0.1:8000/api/health**

---

### Step 2: Start the Frontend Application

1. Open a second terminal in the project root:
   ```powershell
   cd frontend
   ```

2. Run the development server:
   ```powershell
   npm run dev
   ```
   The application will be accessible at **http://localhost:3000** (or the port Vite prints in your terminal).

---

### Step 3: Log In & Explore

You can log in in two ways:
1. **1-Click Demo Login**: Click the **"1-Click Demo Login"** button on the login screen to instantly enter the pre-seeded account.
2. **Demo Credentials**:
   - **Email:** `demo@finpilot.ai`
   - **Password:** `password123`

---

## 🧪 Automated Test Suite Verification

FinPilot AI includes a comprehensive automated test suite (`backend/test_api.py`) covering all 15 core service pathways:

To run the verification suite:
```powershell
cd backend
.\venv\Scripts\python.exe test_api.py
```

**Results:**
```
==================================================
🚀 FINPILOT AI — COMPREHENSIVE AUTOMATED TEST SUITE
==================================================
✅ 1. Health check: PASSED
✅ 2. Demo Login: PASSED (Alex Mercer <demo@finpilot.ai>)
✅ 3. Auth Me Verification: PASSED
✅ 4. Dashboard Summary: PASSED
✅ 5. Transactions Listing: PASSED
✅ 6. Transaction Creation & Screening: PASSED
✅ 7. Budgets Overview: PASSED
✅ 8. AI 50/30/20 Budget Advisor: PASSED
✅ 9. AI Financial Assistant: PASSED
✅ 10. Fraud Overview: PASSED
✅ 11. Deep-Dive Analytics: PASSED
✅ 12. CSV File Analyzer: PASSED
✅ 13. Bank SMS Entity Extractor: PASSED
✅ 14. Suspicious Dataset Fraud Scanner: PASSED
✅ 15. Settings & AI Status: PASSED
==================================================
🎉 ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY!
==================================================
```

---

## 🛡️ Security & Privacy Architecture

- **Zero Real Bank Account Access**: FinPilot AI strictly operates on user-uploaded statements and sample telemetry; it never asks for bank passwords, OTPs, or UPI PINs.
- **Local Key Storage**: Google Gemini API keys are processed strictly by the local FastAPI backend and never leaked to the client bundle.
- **Explainable Anomaly Indicators**: Flagged transactions are explicitly presented as probabilistic variance indicators rather than definitive accusations of fraud.
- **Cryptographic Password Security**: Passwords are saved as salted Bcrypt hashes with stateless JWT authentication.
