# Student Scholarship Monitoring and Academic Compliance System
### Systems Analysis and Design — Comprehensive Laboratory Midterm Examination Section A

- **Examinee Name:** JULIANNE TRISTAN E. DEQUINA  
- **Student ID:** M-006703  
- **Program & Year:** BSIT-3A  
- **Submission Folder:** `SAD_Exam_Section_A_M-006703`  
- **Live Supabase Project URL:** `https://kfbolysjloxvauqrxtye.supabase.co`  
- **Public API Key:** `sb_publishable_QRRGM5APc7vR1tU4i_LZQA_VblMrHgV`  

---

## 📁 Repository Directory Structure

```text
SAD_Exam_Section_A_M-006703/
├── index.html                   # Main application entry point (UI, role switcher, dashboard, forms, test runner)
├── README.md                    # System setup, deployment, credentials, and test documentation
├── analysis_report.md           # Complete Part I Analysis & Design Document (A1 to A6, diagrams, specifications)
├── test_results.md              # Mandatory Functional Test Matrix (TC01 to TC10) with pass/fail evidence
├── css/
│   └── styles.css               # Design system: responsive grid, glassmorphic panels, status badges, dark mode
├── js/
│   ├── complianceEngine.js      # Core policy compliance evaluation rules & Asia/Manila deadline parser
│   ├── supabaseClient.js        # Supabase client integration, backend role isolation, and persistent store
│   ├── testRunner.js            # Automated test suite executor for TC01 to TC10
│   └── app.js                   # Application coordinator, DOM rendering, modal handling, search/filter
└── database/
    ├── 01_schema.sql            # PostgreSQL table definitions, keys, and relational constraints
    ├── 02_policies.sql          # Row-Level Security (RLS) policies enforcing scholar vs staff permissions
    └── 03_seed.sql              # Policy thresholds (Merit/Community), staff profile, and test records A01–A06
```

---

## 🚀 Setup & How to Run

### Method 1: Instant Local Browser Execution (Zero-Install)
The application is 100% self-contained and runnable in any modern web browser:
1. Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.
2. Alternatively, serve via any lightweight static server:
   ```powershell
   # Using npx serve
   npx serve .
   # OR using Python
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your web browser.

### Method 2: Supabase Cloud Database Deployment
If deploying or verifying with live PostgreSQL in Supabase:
1. Navigate to your Supabase Project Dashboard (`https://supabase.com/dashboard/project/kfbolysjloxvauqrxtye`).
2. Open the **SQL Editor**.
3. Run the scripts in the following order:
   - `database/01_schema.sql` (Creates tables, foreign keys, and indexes)
   - `database/02_policies.sql` (Enables Row-Level Security policies)
   - `database/03_seed.sql` (Inserts Merit & Community policies and synthetic records A01–A06)

---

## 🔑 Real User Login Credentials

All users authenticate on the **Log In Page** using either their **ID** or **Email Address** along with their password:

| Role | Username / ID | Email Address | Password | Scholar / Staff Name | Program | Test Scenario Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **🛡️ Staff** | `STAFF-001` | `staff@scholarship.edu` | `password123` | Atty. Eleanor Vance | Coordinator (All) | Administrative review, verification, evaluation, and renewal gating |
| **🎓 Scholar** | `A01` | `a01@scholar.edu` | `password123` | Adrian Cruz | Merit Scholar | Boundary test: GWA 1.75 at exact deadline boundary |
| **🎓 Scholar** | `A02` | `a02@scholar.edu` | `password123` | Bianca Santos | Merit Scholar | GWA deficiency test (GWA 1.76 exceeds 1.75 limit) |
| **🎓 Scholar** | `A03` | `a03@scholar.edu` | `password123` | Carlos Mendoza | Community Scholar | Program allowance test (1 dropped subject allowed) |
| **🎓 Scholar** | `A04` | `a04@scholar.edu` | `password123` | Danielle Reyes | Community Scholar | Multiple deficiency test (14 units < 15, and 1 INC) |
| **🎓 Scholar** | `A05` | `a05@scholar.edu` | `password123` | Eduardo Garcia | Merit Scholar | Penalty test: 1 failed subject and submitted 1 minute late |
| **🎓 Scholar** | `A06` | `a06@scholar.edu` | `password123` | Fatima Navarro | Community Scholar | Correction workflow: returned evidence & resubmission flow |

---

## 🧪 Running the Mandatory Functional Test Suite (TC01 to TC10)

1. Open the application in your browser.
2. Click the **"🧪 Test Suite (TC01–TC10)"** tab in the navigation bar.
3. Click the **"▶️ Run All Tests (TC01–TC10)"** button.
4. The test harness automatically executes all 10 scenarios in sequence against the repository, asserting outcomes and printing live pass/fail evidence.
5. All 10 tests will report **10 / 10 Tests Passed (100%)**.

---

## 🛡️ Backend Role Isolation & Security Verification (TC08)

The system enforces data protection and role boundaries at the data/repository layer:
- **Scholar Restriction:** When logged in as Scholar `A01`, calling `window.DB.getSubmissions()` strictly filters and returns only `A01`'s rows.
- **Cross-Scholar Guard:** Calling `window.DB.getSubmissionById(scholarA01, 'c0000000-0000-0000-0000-000000000002')` throws `403 Forbidden`.
- **Action Guard:** Calling staff operations (`verifyEvidence`, `recordRenewalDecision`) from a scholar account throws `403 Forbidden`.

---

## ⚠️ Known Limitations & Exclusions
In strict accordance with the examination scenario exclusions:
1. No live Registrar API is integrated; student summaries are entered and cross-checked against cloud document references.
2. The system does not execute financial or bursar monetary disbursements.
3. Exceptions or administrative overrides for deficient scholars are outside the exam scope and must be placed on `Held`.
