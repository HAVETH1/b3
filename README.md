<div align="center">

# 💰 FinanceIQ

### Personal Finance Management Dashboard

*Track smarter. Spend better. Save more.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-Interactive-FF6384?style=for-the-badge&logo=chartdotjs)](https://www.chartjs.org)

---

![FinanceIQ Dashboard](./public/preview.png)

</div>

---

## ✨ Features

| | Feature | Description |
|:---:|---|---|
| 📊 | **Real-time Dashboard** | KPI cards, monthly summaries & spending trends at a glance |
| 💸 | **Transaction Manager** | Add, edit, delete with categories, search, filter & sort |
| 📋 | **Budget Planner** | Set monthly limits per category with visual progress tracking |
| 📈 | **Analytics** | 4 interactive Chart.js charts — line, bar, doughnut, savings trend |
| 🎯 | **Savings Goals** | Circular progress rings with contribution tracking |
| 💡 | **Financial Insights** | Automated, data-driven spending intelligence |
| ⚙️ | **Settings** | Profile, multi-currency, dark/light mode, CSV export |
| 🔐 | **Secure Auth** | Supabase Auth with Row-Level Security (RLS) on all data |

---

## 🖼️ Screenshots

| Login | Dashboard | Transactions |
|:---:|:---:|:---:|
| ![Login](<./preview images/01_login_page.png>) | ![Dashboard](<./preview images/02_dashboard.png>) | ![Transactions](<./preview images/03_transactions.png>) |

| Budgets | Analytics | Goals |
|:---:|:---:|:---:|
| ![Budgets](<./preview images/04_budgets.png>) | ![Analytics](<./preview images/05_analytics.png>) | ![Goals](<./preview images/06_goals.png>) |

| Insights | Settings | Dark Mode |
|:---:|:---:|:---:|
| ![Insights](<./preview images/07_insights.png>) | ![Settings](<./preview images/08_settings.png>) | ![Dark Mode](<./preview images/09_dark_mode.png>) |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd financeiq
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set Up the Database

Run [`supabase-setup.sql`](./supabase-setup.sql) in your Supabase SQL Editor. This sets up:

- ✅ `profiles`, `transactions`, `budgets`, `goals` tables
- ✅ Row-Level Security (RLS) policies for multi-tenant data isolation
- ✅ Indexes for optimized query performance
- ✅ Auto-profile trigger on user signup

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Vanilla CSS with CSS Custom Properties |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth (JWT + Row-Level Security) |
| **Charts** | Chart.js + react-chartjs-2 |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
app/
├── (auth)/              # Login & Signup pages
└── (dashboard)/         # Protected dashboard routes
    ├── page.tsx             # Dashboard overview
    ├── transactions/        # Transaction CRUD
    ├── budgets/             # Budget management
    ├── analytics/           # Charts & trends
    ├── goals/               # Savings goals
    ├── insights/            # Financial insights
    └── settings/            # User preferences

components/
├── layout/              # Sidebar, TopBar, MobileNav
├── transactions/        # Transaction form
└── ui/                  # Modal, Toast, Progress, Skeleton

lib/
├── supabase/            # Client, Server, Middleware
├── constants.ts         # Categories, currencies
├── utils.ts             # Formatting utilities
└── seed.ts              # Sample data generator
```

---

## 🔒 Security

- 🛡️ All data protected with **PostgreSQL Row-Level Security**
- 👤 Users can only access their own data (`auth.uid() = user_id`)
- 🔑 Service role key is **never** exposed to the client
- 🔄 JWT sessions securely managed via `@supabase/ssr`

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover utility functions, financial calculations, data validation, and business logic.

---

## 🌐 Deployment

Deploy on [Vercel](https://vercel.com) in minutes — just set the three environment variables and hit deploy.

```bash
npm run build   # Verify production build locally first
```

---

## 📄 Documentation

- 📘 Full project report: [`PROJECT_REPORT.md`](./PROJECT_REPORT.md)
- 📋 Requirements spec: [`REQUIREMENTS.md`](./REQUIREMENTS.md)

---

<div align="center">

Made with ❤️ using Next.js & Supabase

</div>
