# SpendWise AI ⚡
### Intelligent Expense Management, Fraud Detection & Automated Reimbursement Platform
> **Product Tagline:** *"Spend Smarter. Stay Compliant. Reimburse Faster."*

SpendWise AI transforms corporate expense management into an automated, transparent, and auditable experience using AI, OCR document extraction, deterministic policy verification, and explainable neural anomaly detection.

---

## 🌟 Key Highlights & Capabilities

1. **AI Receipt Scanner & OCR 2.0 Studio**
   - Drag-and-drop or upload receipts (JPEG, PNG, WebP, PDF) with image quality & blur detection.
   - Extract merchant names, transaction dates, itemized line items, tax, currency, and total amounts with confidence scoring.
   - Cryptographic SHA-256 hash checks prevent duplicate receipt submissions.
   - Interactive preview canvas: 90° rotation, zoom in/out, and raw OCR text inspector.

2. **Smart Expense Categorization with Explainable Rationale**
   - Automatically maps vendors and item descriptions to 10 enterprise categories:
     *Travel, Accommodation, Meals & Entertainment, Office Supplies, Software & Subscriptions, Transportation, Client Meetings, Training & Education, Utilities, and Other*.
   - Explains *why* an expense was categorized (e.g., *"Matched known vendor 'Delta Air Lines' -> Classified as Travel"*).

3. **Deterministic Corporate Policy Compliance Engine**
   - Daily meal allowance caps ($75/day).
   - Commercial flight cabin class restrictions (Economy permitted; Business/First Class flagged as violation).
   - Mandatory receipt requirement for any transaction exceeding $25.
   - Single-transaction spending ceilings ($2,500 manager escalation threshold; >$5,000 policy violation).
   - Auditable manager exception override workflow for legitimate corporate exceptions.

4. **Explainable Anomaly & Fraud Detection Desk**
   - Calculates dynamic Anomaly Risk Scores (0–100%) categorized into **Low**, **Medium**, and **High**.
   - Evaluates duplicate image hashes, category statistical deviation (>3x average), round-number billing flags, and weekend operational expenditures.
   - Provides clear review signals without unfairly accusing employees.
   - Dedicated investigation resolution flow (*Mark as Legitimate* or *Flag/Deny Claim*).

5. **Departmental Budget Intelligence & Run-Rate Forecasting**
   - Live budget utilization progress bars with threshold warnings (>=80%).
   - Dynamic month-end projected spending run rates based on daily velocity.
   - Sub-category allocation breakdowns across cost centers.

6. **Expense Reports & Reimbursement Workflow**
   - Full lifecycle pipeline: `Draft` → `Submitted` → `Under Review` → `Approved` → `Reimbursement Pending` → `Reimbursed`.
   - Real client-side **PDF Export** (via `jspdf` & `jspdf-autotable`) and **CSV Export**.
   - Multi-level manager and finance sign-offs.

7. **Business Mileage Route Calculator**
   - Calculates road travel distance between origins and destinations.
   - Automatically applies standard IRS 2026 reimbursement formula: `Reimbursement = Approved Distance × $0.67/mi`.
   - Automatically generates unified expense claims.

8. **Split Expenses & Foreign Currency Support**
   - Multi-department, multi-project expense splitting with percentage/dollar balancing validation.
   - Foreign currency conversion for EUR, GBP, CAD, JPY, AUD with exchange rate caching.

9. **Modular Integrations Hub**
   - Connectors for **QuickBooks Online, Xero, Expensify, SAP Concur, Google Cloud Vision OCR, Tesseract OCR, ExchangeRate-API, and Google Maps**.
   - Real connection status indicators (*Live Connected*, *Demo Mode*, *Not Connected*).

---

## 👥 Demo Personas (One-Click Role Switching)

The application includes 4 pre-configured enterprise personas accessible from the top navigation bar or login screen:

| Role | Name | Title | Department | Email / Password |
|---|---|---|---|---|
| **Employee** | Alex Rivera | Senior Software Engineer | Engineering | `alex@spendwise.ai` / `password123` |
| **Manager** | Sarah Jenkins | Director of Engineering | Engineering Lead | `sarah@spendwise.ai` / `password123` |
| **Finance** | David Chen | Corporate Financial Controller | Finance | `david@spendwise.ai` / `password123` |
| **Admin** | Elena Rostova | VP Operations & Admin | Executive Ops | `elena@spendwise.ai` / `password123` |

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript, Vite
- **Styling:** Vanilla CSS design system tokens + Tailwind CSS v4
- **Components & Icons:** Lucide React icons, accessible modals, responsive drawers
- **Data Visualization:** Recharts (Area charts, Donut charts, Bar charts)
- **Exports:** jsPDF, jspdf-autotable
- **Effects:** Canvas Confetti

### Backend
- **Runtime:** Node.js v24 + Express + TypeScript (`tsx`)
- **API Architecture:** RESTful endpoints with role-based JWT middleware
- **Database Engine:** Dual-mode architecture:
  - **MongoDB Atlas** with Mongoose when `MONGODB_URI` is provided in `.env`.
  - **Embedded File-Backed Store** (`server/data/db.json`) enabling 100% out-of-the-box operation with zero external database configuration.
- **Security:** Password hashing, JWT token validation, CORS, file size and MIME-type restrictions.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Backend Setup
```bash
cd server
npm install
npm run test    # Runs the 23 core tests
npm run dev     # Starts the REST API on port 5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run build   # Validates TypeScript compilation
npm run dev     # Starts Vite development server on port 3000
```

### 4. Access the Application
Open your browser and navigate to:
```
http://127.0.0.1:3000
```
Use the top right Persona Switcher pill to instantly test role-based dashboards and approval workflows.

---

## 🧪 Automated Test Suite

Run the automated test suite verifying OCR extraction, policy engine rules, anomaly detection, currency conversion, and mileage routing:
```bash
cd server
npm test
```

Results:
```
========================================
 SPENDWISE AI - CORE TEST SUITE
========================================
1. OCR Extraction & Quality Checks:
  ✓ Flags images smaller than 3KB as low-resolution/corrupted
  ✓ Detects blurry/unreadable image filenames and triggers retake prompt
  ✓ Passes valid standard receipt buffer
  ✓ Correctly extracts merchant name "DELTA AIR LINES"
  ✓ Correctly extracts total amount $637.89
  ✓ Identifies currency as USD
  ✓ Yields high OCR confidence score for clean receipt

2. Smart Categorization Engine & Reasoning:
  ✓ Categorizes Uber as Transportation
  ✓ Provides transparent reasoning mentioning matched merchant
  ✓ Categorizes AWS as Software & Subscriptions
  ✓ Categorizes restaurant dining as Meals & Entertainment

3. Policy Compliance Engine Rules:
  ✓ Expenses <= $25 pass without mandatory receipt
  ✓ Expenses > $25 without receipt trigger policy violation
  ✓ Meal exceeding $75/day triggers policy warning
  ✓ First/Business class airfare triggers policy violation
  ✓ Single transactions > $5,000 trigger maximum single-item violation

4. Anomaly & Fraud Assessment:
  ✓ Standard meal registers as Low Risk
  ✓ Detects round number fabricated pattern

5. Currency Conversion Engine:
  ✓ Converts 100 EUR to 108.00 USD at standard 1.08 rate
  ✓ Converts 100 GBP to 128.00 USD at standard 1.28 rate
  ✓ Correctly formats financial currency string

6. Mileage Distance Routing:
  ✓ Accurately resolves SF to San Jose routing distance (48.5 miles)
  ✓ Computes correct reimbursement (48.5 mi * $0.67/mi = $32.50)

========================================
 TEST RUN RESULTS: 23 PASSED, 0 FAILED
========================================
```

---

## 📄 License
SpendWise AI is developed for modern enterprise expense automation. All rights reserved.
