# FinanceIQ — Product Requirements Document (PRD) & User Stories

**Document Version:** 1.0.0  
**Project:** FinanceIQ — Personal Finance Management Dashboard  
**Status:** Approved / Baseline  
**Architecture:** Next.js 16 (App Router), Supabase (PostgreSQL + RLS), Vanilla CSS Design System  

---

## 1. System Overview & User Personas

### 1.1 Purpose
FinanceIQ is designed to deliver a modern, automated, and secure personal finance management experience. It empowers users to track multi-channel income/expenses, configure category budgets with real-time threshold monitoring, plan long-term savings goals, and glean proactive spending intelligence without manual spreadsheet calculations.

### 1.2 Target User Personas
* **Persona A: Working Professional (Aryan, 28)**  
  * *Needs:* Wants a unified cockpit to monitor monthly salary, recurring rent/utilities, track investments, and ensure credit card spending doesn't exceed 30% of income.
  * *Pain Points:* Fragmented bank statements, lack of real-time category alerts.
* **Persona B: Freelancer / Gig Worker (Sneha, 24)**  
  * *Needs:* Manages irregular income streams across clients and requires savings targets (e.g., equipment purchase, emergency reserve) with visual countdown milestones.
  * *Pain Points:* Difficulties predicting month-end net savings and variable cash flow.

---

## 2. Epics, User Stories & Acceptance Criteria

Each user story follows the industry standard format:  
**As a** `[Role]`, **I want to** `[Action]`, **So that** `[Business Value / Benefit]`.  
Acceptance criteria are articulated using **Gherkin syntax (Given - When - Then)**.

---

### Epic 1: Authentication & Account Security (AUTH)

#### US-1.1: User Registration
* **Story:** As a new user, I want to create an account with my name, email, and password, so that I can establish a private financial workspace.
* **Acceptance Criteria:**
  * **Scenario 1.1.1 (Valid Registration):**
    * *Given* I am on the `/signup` page
    * *When* I provide a valid name, valid email, and a password >= 6 characters and click "Create Account"
    * *Then* a new auth record and associated profile row (`id`, `full_name`, `currency='INR'`, `theme='light'`) must be provisioned in Supabase.
  * **Scenario 1.1.2 (Invalid Password):**
    * *Given* I input a password with fewer than 6 characters
    * *When* I view the form
    * *Then* an inline validation error "Password must be at least 6 characters" is displayed and submission is blocked.

#### US-1.2: User Authentication & Session Persistence
* **Story:** As a registered user, I want to log in securely and stay authenticated across page reloads, so that I don't have to re-enter credentials constantly.
* **Acceptance Criteria:**
  * **Scenario 1.2.1 (Successful Login):**
    * *Given* I am on `/login` with valid credentials
    * *When* I submit the login form
    * *Then* Supabase JWT session cookies are set and I am redirected to the Dashboard (`/`).
  * **Scenario 1.2.2 (Protected Route Interception):**
    * *Given* an unauthenticated user attempts to access `/transactions`, `/budgets`, or `/settings`
    * *When* the Next.js `proxy.ts` middleware evaluates the request
    * *Then* the request must be redirected to `/login` immediately.

#### US-1.3: Multi-Tenant Data Isolation (Zero Trust)
* **Story:** As a user, I want complete privacy so that no other authenticated user can access, query, or mutate my transactions, budgets, or goals.
* **Acceptance Criteria:**
  * **Scenario 1.3.1 (PostgreSQL RLS Enforcement):**
    * *Given* user A is authenticated with UID `uuid-A`
    * *When* any query is executed against `profiles`, `transactions`, `budgets`, or `goals`
    * *Then* PostgreSQL Row-Level Security policies (`auth.uid() = user_id`) must filter rows exclusively to `uuid-A`.

---

### Epic 2: Real-Time Financial Dashboard (DASH)

#### US-2.1: Monthly KPI Metrics Computation
* **Story:** As a user, I want to view my Total Balance, Monthly Income, Monthly Expense, and Savings Rate at a glance, so that I can immediately evaluate my current month's financial standing.
* **Acceptance Criteria:**
  * **Scenario 2.1.1 (KPI Calculations):**
    * *Given* I have recorded income of ₹97,500 and expenses of ₹16,090 in the current month
    * *When* I load the dashboard
    * *Then* Total Balance displays ₹81,410, Monthly Income displays ₹97,500, Monthly Expenses displays ₹16,090, and Savings Rate displays 83%.
  * **Scenario 2.1.2 (Month-over-Month Comparisons):**
    * *Given* previous month expense was ₹35,050 and current is ₹16,090
    * *When* the expense KPI renders
    * *Then* a green badge indicating `−54% vs last month` is shown.

#### US-2.2: Instant Sample Data Seeding
* **Story:** As a new user with an empty account, I want a 1-click option to load realistic demo data, so that I can preview charts and insights without manually entering 40+ transactions.
* **Acceptance Criteria:**
  * **Scenario 2.2.1 (Seed Data Execution):**
    * *Given* an account with 0 transactions
    * *When* I click "🎲 Load Sample Data"
    * *Then* 44 transactions (spanning 6 months), 10 category budgets, and 4 savings goals are inserted and the UI refreshes automatically with success feedback.

---

### Epic 3: Transaction Ledger & Management (TXN)

#### US-3.1: Add & Edit Transactions
* **Story:** As a user, I want to log income and expense items with categories, amounts, dates, and payment methods, so that my ledger stays up to date.
* **Acceptance Criteria:**
  * **Scenario 3.1.1 (Transaction Creation):**
    * *Given* the Add Transaction modal is open
    * *When* I select Type "Expense", Category "Food & Dining", Amount "450", Date "Today", Payment Method "UPI" and click Submit
    * *Then* a record is persisted in `transactions` and immediately reflected across the ledger and dashboard.
  * **Scenario 3.1.2 (Amount Validation):**
    * *Given* Amount is 0 or negative or non-numeric
    * *When* I attempt to submit
    * *Then* submission is prevented and "Enter a valid amount" error is displayed.

#### US-3.2: Multi-Criteria Filtering & Sorting
* **Story:** As a user, I want to search and filter transactions by keyword, type, category, and month, and sort by date or amount, so that I can quickly locate specific expenses.
* **Acceptance Criteria:**
  * **Scenario 3.2.1 (Combined Search & Filter):**
    * *Given* I have 44 transactions
    * *When* I type "Swiggy" in search and select Type "Expense"
    * *Then* only matching expense rows containing "Swiggy" are shown with dynamic recalculation of filtered totals.

#### US-3.3: Receipt Image & Invoice Attachment (Supabase Cloud Storage)
* **Story:** As a user, I want to attach bill photos or receipt PDFs to any transaction and view them later, so that I maintain proof of expense for tax/accounting records.
* **Acceptance Criteria:**
  * **Scenario 3.3.1 (Receipt Upload):**
    * *Given* the transaction form is open
    * *When* I attach a valid receipt file (PNG, JPG, WebP, PDF <= 5MB)
    * *Then* the file is uploaded to the Supabase Storage `receipts` bucket scoped to my user folder and the generated public URL is stored in `transactions.receipt_url`.
  * **Scenario 3.3.2 (Receipt Preview Modal):**
    * *Given* a transaction row has an attached receipt
    * *When* I click the "View" receipt button in the ledger
    * *Then* an accessible modal displays the full receipt preview with an option to open in a new tab.

#### US-3.4: Real-Time Multi-Device Transaction Sync (Supabase Realtime)
* **Story:** As a user with multiple open tabs or devices, I want ledger changes to synchronize instantly without manual page refreshing.
* **Acceptance Criteria:**
  * **Scenario 3.4.1 (Real-time Broadcast & Invalidation):**
    * *Given* I have the dashboard or transaction ledger open
    * *When* a transaction is created, edited, or deleted from another session
    * *Then* the Supabase Realtime channel (`postgres_changes` on `transactions`) receives the event and dynamically updates the UI with a notification toast.

---

### Epic 4: Category Budgets & Alert Thresholds (BDG)

#### US-4.1: Category Budget Limits
* **Story:** As a user, I want to define monthly spending ceilings for specific expense categories (e.g., Food: ₹5,000, Transport: ₹2,000), so that I can prevent overspending.
* **Acceptance Criteria:**
  * **Scenario 4.1.1 (Budget Creation):**
    * *Given* I am on `/budgets`
    * *When* I set a limit of ₹5,000 for "Food & Dining" for month `2026-08`
    * *Then* a unique constraint `(user_id, category, month)` prevents duplicates and records the target.

#### US-4.2: Visual Threshold Warning States
* **Story:** As a user, I want visual color-coded feedback on my budget utilization, so that I know when I am nearing or exceeding limits.
* **Acceptance Criteria:**
  * **Scenario 4.2.1 (Safe State < 75%):**
    * *Given* spent is ₹3,000 of ₹5,000 (60%)
    * *Then* progress bar is Green (`var(--color-success)`) and badge displays "On Track".
  * **Scenario 4.2.2 (Warning State 75% - 99%):**
    * *Given* spent is ₹4,000 of ₹5,000 (80%)
    * *Then* progress bar is Amber (`var(--color-warning)`) and badge displays "Near Limit".
  * **Scenario 4.2.3 (Exceeded State >= 100%):**
    * *Given* spent is ₹5,150 of ₹5,000 (103%)
    * *Then* progress bar is Red (`var(--color-danger)`) and badge displays "Over Budget".

---

### Epic 5: Financial Analytics & Visualizations (ANL)

#### US-5.1: 6-Month Income vs. Expense Trend Analysis
* **Story:** As a user, I want to view a continuous line chart comparing income and expenses over the last 6 months, so that I can spot seasonal financial variations.
* **Acceptance Criteria:**
  * **Scenario 5.1.1 (Chart Rendering):**
    * *Given* I navigate to `/analytics`
    * *When* 6-month historical data exists
    * *Then* Chart.js renders a 2-dataset smoothed line chart with green (Income) and red (Expense) fill curves and interactive tooltip currency formatting.

#### US-5.2: Category Expense Breakdown (Doughnut)
* **Story:** As a user, I want a proportional doughnut chart of my top spending categories, so that I understand where my capital goes.
* **Acceptance Criteria:**
  * **Scenario 5.2.1 (Proportional Representation):**
    * *Given* expenses distributed across Food, Rent, Shopping, Transport
    * *Then* a doughnut chart renders the top categories with category-specific brand colors and percentage legends.

---

### Epic 6: Target-Driven Savings Goals (GOAL)

#### US-6.1: Goal Creation with Target Dates
* **Story:** As a user, I want to create milestone goals (e.g., "Emergency Fund", "Goa Trip") with target amounts and dates, so that I can monitor progress toward major life milestones.
* **Acceptance Criteria:**
  * **Scenario 6.1.1 (Goal Progress Ring):**
    * *Given* a goal of ₹1,00,000 with ₹45,000 saved
    * *When* rendered on `/goals`
    * *Then* an SVG circular ring shows 45% completion, remaining amount of ₹55,000, and countdown of days remaining.

#### US-6.2: Quick Contribution Workflow
* **Story:** As a user, I want to deposit funds into an existing goal without editing the whole goal definition, so that updating savings is frictionless.
* **Acceptance Criteria:**
  * **Scenario 6.2.1 (Contribute Funds):**
    * *Given* a goal currently at ₹45,000 / ₹1,00,000
    * *When* I click "Contribute" and add ₹5,000
    * *Then* `current_amount` updates to ₹50,000 (50%) and toast confirms addition.

---

### Epic 7: Automated Financial Insights Engine (INS)

#### US-7.1: Real-Time Heuristic Financial Advisory
* **Story:** As a user, I want automated diagnostic insights generated from my transaction data, so that I receive actionable advice without manual analysis.
* **Acceptance Criteria:**
  * **Scenario 7.1.1 (Savings Rate Diagnosis):**
    * *Given* Savings Rate >= 30%
    * *Then* an Insight card appears: "🚀 Excellent Savings Rate: You're saving X% of your income this month — well above the 20% benchmark."
  * **Scenario 7.1.2 (Spending Spikes & Budget Overrun):**
    * *Given* Food spending increased > 25% vs last month or a budget exceeded 100%
    * *Then* High-priority Warning/Danger insight cards are surfaced at the top of `/insights`.

#### US-7.2: AI & Statistical ML Spending Forecast (Linear Regression)
* **Story:** As a user, I want an AI-projected estimate of my month-end expenses and next month's financial obligation, so that I can prevent end-of-month budget deficits.
* **Acceptance Criteria:**
  * **Scenario 7.2.1 (Linear Regression & Burn Rate):**
    * *Given* historical 6-month transactions and current month spending of ₹16,090 across 14 days
    * *When* I view `/insights`
    * *Then* an AI Forecast card shows End-of-Month projected spending, average daily burn rate (₹X/day), next month forecast, trend slope direction, and a statistical confidence score (e.g., 85%).
  * **Scenario 7.2.2 (Category AI Projections):**
    * *Given* historical category distributions
    * *Then* category spend projection chips render estimated next-month demands for top categories (Rent, Food, Shopping).

#### US-7.3: Recurring Transaction & Subscription Detection
* **Story:** As a user, I want the system to automatically discover my recurring subscriptions and monthly bills, so that I understand my fixed committed costs.
* **Acceptance Criteria:**
  * **Scenario 7.3.1 (Periodicity Clustering):**
    * *Given* repeating transactions (e.g., Netflix ₹649/mo, Rent ₹22,000/mo) spaced ~30 days apart
    * *When* pattern detection runs
    * *Then* subscriptions are extracted with cadence badge ("Monthly"), estimated next billing date, and annualized cost calculation.

---

### Epic 8: Settings, Theming & Data Portability (SET)

#### US-8.1: Dark/Light Mode Preference Persistence
* **Story:** As a user, I want to toggle between Dark and Light mode and have my preference saved, so that the UI matches my ambient lighting.
* **Acceptance Criteria:**
  * **Scenario 8.1.1 (Theme Toggle & LocalStorage):**
    * *Given* I click the Moon icon
    * *Then* `[data-theme="dark"]` is applied to `<html>`, colors update via CSS variables, and choice is saved to `localStorage` and `profiles.theme`.

#### US-8.2: CSV Transaction Export & Data Deletion
* **Story:** As a user, I want to export my full transaction ledger to CSV and have the right to purge all my financial data, so that I retain full data ownership.
* **Acceptance Criteria:**
  * **Scenario 8.2.1 (CSV Export):**
    * *Given* I click "Export CSV" on `/settings`
    * *Then* a formatted `financeiq-transactions-YYYY-MM-DD.csv` file downloads with headers: Date, Type, Category, Description, Amount, Payment Method.
  * **Scenario 8.2.2 (Nuclear Data Purge):**
    * *Given* I confirm "Yes, Delete Everything" in the Danger Zone modal
    * *Then* all rows in `transactions`, `budgets`, and `goals` for my `user_id` are deleted and a confirmation toast is shown.

---

## 3. Non-Functional Requirements (NFRs)

| Attribute | Requirement Specification | Metric / Validation |
|---|---|---|
| **NFR-1: Performance** | Time to First Byte (TTFB) < 250ms; Initial page load < 1.2s on standard broadband. | Server-side rendering (SSR) of initial dashboard payload. |
| **NFR-2: Security** | Zero-trust database multi-tenancy. Zero storage of plaintext secrets in source code. | PostgreSQL RLS enabled on 100% of public tables. `.env.local` protection. |
| **NFR-3: Accessibility** | Keyboard navigable modals (`Escape` dismiss, focus trap), screen-reader labels on icon-only buttons. | Complies with WCAG 2.1 Level AA color contrast ratios (>= 4.5:1). |
| **NFR-4: Responsiveness** | Seamless UX across Mobile (< 768px), Tablet (768px - 1024px), and Desktop (> 1024px). | Mobile bottom navigation dock below 1024px; CSS grid dynamic reflow. |
| **NFR-5: Test Reliability** | Core business logic, calculations, and date formatting must be verified by automated unit tests. | Jest test suite with 100% pass rate across 38+ unit tests. |

---

## 4. Requirement Traceability Matrix (RTM)

| Requirement ID | User Story Title | Frontend Route / Component | Database Entities | Test Suite Coverage |
|---|---|---|---|---|
| **REQ-AUTH-01** | User Registration & Login | `/login`, `/signup`, `proxy.ts` | `auth.users`, `profiles` | Manual / Browser Verification |
| **REQ-DASH-01** | Real-Time KPI Cards | `app/(dashboard)/page.tsx`, `DashboardClient.tsx` | `transactions`, `budgets`, `goals` | `__tests__/utils.test.ts` (KPI math) |
| **REQ-TXN-01** | Transaction CRUD & Filters | `/transactions`, `TransactionForm.tsx` | `transactions` | `__tests__/utils.test.ts` (Formatting) |
| **REQ-BDG-01** | Category Budget Thresholds | `/budgets`, `ProgressBar.tsx` | `budgets`, `transactions` | `__tests__/utils.test.ts` (Utilization logic) |
| **REQ-ANL-01** | Interactive Chart Analytics | `/analytics`, `AnalyticsClient.tsx` | `transactions` | `__tests__/utils.test.ts` (6-month ranges) |
| **REQ-GOAL-01** | Milestone Goals & SVG Rings | `/goals`, `GoalsClient.tsx`, `ProgressRing` | `goals` | `__tests__/utils.test.ts` (Days remaining) |
| **REQ-INS-01** | Automated Insights Engine | `/insights`, `InsightsClient.tsx` | `transactions`, `budgets` | `__tests__/utils.test.ts` (Percent change) |
| **REQ-AI-01** | AI Linear Regression Spending Forecast | `lib/ai-forecast.ts`, `InsightsClient.tsx` | `transactions` | `__tests__/utils.test.ts` (AI model tests) |
| **REQ-REC-01** | Recurring Subscriptions Pattern Detector | `lib/ai-forecast.ts`, `InsightsClient.tsx` | `transactions` | `__tests__/utils.test.ts` (Periodicity tests) |
| **REQ-STR-01** | Cloud Receipt Storage & Viewer | `TransactionForm.tsx`, `TransactionsClient.tsx` | `storage.buckets/receipts`, `transactions` | Manual / Storage API |
| **REQ-RT-01** | Real-time Multi-Tab Sync | `TransactionsClient.tsx`, `DashboardClient.tsx` | `supabase_realtime (transactions)` | Manual / Realtime WebSocket |
| **REQ-SET-01** | Theming, CSV Export & Danger Zone | `/settings`, `SettingsClient.tsx` | `profiles`, `transactions`, `budgets`, `goals` | Manual / Browser Verification |
