# 🛡️ Codeward Admin Portal — Agent Handover & Architecture Guide

Welcome, incoming agent. This document is your comprehensive operational blueprint for developing, maintaining, and deploying the **Codeward Internal Admin Portal**.

---

## 1. 🚨 STRICT REPOSITORY & SECURITY BOUNDARIES

> [!CAUTION]
> **DO NOT VIOLATE THE MONOREPO / PRIVATE BOUNDARY.**
> The main parent directory `c:\Users\pc\Desktop\codeward project` maps to `kelvinmaina01/codeward-`, which is an **OPEN-SOURCE (Apache-2.0)** repository.
> 
> Under **NO circumstances** should `codeward-admin/` ever be committed or pushed to `codeward-`. 
> It is strictly ignored via `.gitignore` in the root repository.

### Git Configuration for Admin:
- **Local Path**: `c:\Users\pc\Desktop\codeward project\codeward-admin\`
- **Remote Repo**: `https://github.com/kelvinmaina01/codeward-admin.git`
- **Visibility**: **Private (Internal Use Only)**
- **Active Branch**: `main`
- **Push Command**:
  ```powershell
  cd "c:\Users\pc\Desktop\codeward project\codeward-admin"
  git push origin main
  ```

---

## 2. 🏗️ Tech Stack & Dependencies

The Admin Portal is built as a lightning-fast, high-aesthetic Single Page Application (SPA):

- **Bundler & Runtime**: [Vite 8](https://vite.dev) with native Rolldown engine
- **UI Framework**: [React 19](https://react.dev) + TypeScript (~6.0)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Data Fetching & State**: [@tanstack/react-query v5](https://tanstack.com/query)
- **Routing**: [React Router v7](https://reactrouter.com) (Browser router mode with SPA rewrites)
- **Icons**: [Lucide React](https://lucide.dev)
- **Charts**: [Recharts v3](https://recharts.org)
- **Authentication Client**: `better-auth/react`

---

## 3. 🔐 Authentication & Role-Based Access Control (RBAC)

The portal connects to the backend API (`/api/admin/*`), which implements dual-mode authentication:

1. **Session Cookie Auth (Primary)**:
   - Uses Better Auth credentials (`signIn.email({ email, password })`).
   - The API verifies that the user record in PostgreSQL has `role = 'super_admin'`.
   - Browser requests send cookies automatically via `credentials: 'include'`.
2. **Machine-to-Machine Secret Key (Fallback)**:
   - Header: `x-admin-key: <VITE_ADMIN_KEY>`
   - Query param: `?key=<VITE_ADMIN_KEY>`
   - Validated against `BETTER_AUTH_SECRET` on the API server.

### Default Super Admin Credentials (Production):
- **Email**: `kelvin.reallife8@gmail.com`
- **Role**: `super_admin`
- **Password**: `paraKenya8#`

---

## 4. 🌐 Environment Variables

| Variable | Description | Production Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base admin endpoint URL | `https://api.codeward.cloud/api/admin` |
| `VITE_ADMIN_KEY` | Admin machine secret key | `codeward-super-secret-change-in-prod-2024` |

> [!NOTE]
> Local `.env` is git-ignored. Template keys are committed in `.env.example`. When configuring Vercel, enter these keys in **Project Settings → Environment Variables**.

---

## 4.1 🗄️ Database Architecture & CI/CD Topology

| Component | Provider & Host | Status & Role | Details |
| :--- | :--- | :--- | :--- |
| **Live Production DB** | **AWS RDS PostgreSQL** (`eu-north-1`)<br>`codeward-postgres.cdg8qa4mglvg.eu-north-1.rds.amazonaws.com` | **Active / Primary** | Real production database (61+ users, 178+ runs, active writes today). Accessible via SSL. |
| **Backup DB** | **Supabase Pooler** (`eu-central-1`)<br>`aws-1-eu-central-1.pooler.supabase.com:6543` | **Stale Backup** | Frozen snapshot from Sept 25, 2026 (21 users, 76 runs). Do **NOT** use for live admin queries. |
| **Production API** | **AWS ECS Fargate behind ALB**<br>`https://api.codeward.cloud` | **Live Endpoint** | Directly wired to AWS RDS. Admin routes live under `/api/admin/*`. |
| **CI/CD Pipeline** | **GitHub Actions** (`.github/workflows/deploy.yml`) | **Automated** | Pushes to `main` on `kelvinmaina01/codeward-` trigger ARM64 Docker builds pushed to ECR and deployed to ECS. |

---

## 5. 🚀 Vercel Deployment Rules

The portal is continuously deployed to **Vercel** connected to `kelvinmaina01/codeward-admin.git`.

### Critical Dashboard Settings on Vercel:
1. **Root Directory**: Must be empty (`./`). Do **NOT** set it to `codeward-admin` since this repo already contains `package.json` at its root.
2. **Framework Preset**: Must be set to **Vite**.
3. **Build Command**: Default (`npm run build`, which triggers `tsc -b && vite build`).
4. **Output Directory**: `dist`.
5. **SPA Routing**: Handled by [`vercel.json`](file:///c:/Users/pc/Desktop/codeward%20project/codeward-admin/vercel.json):
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 6. 🗺️ Application Routes & Page Architecture

All pages live in `src/pages/`:

```
codeward-admin/src/
├── App.tsx                     # Route definitions & Theme / Auth providers
├── components/
│   ├── Layout.tsx              # Primary sidebar, topbar, user profile, theme toggle
│   ├── ProtectedRoute.tsx      # Guards routes against unauthorized users
│   └── ui/                     # Reusable Button, Card, Badge components
├── lib/
│   ├── api.ts                  # apiFetch wrapper with automatic JSON and cookie handling
│   ├── auth-client.ts          # Better Auth React client instance
│   └── auth-context.tsx        # React Context storing current user & session
└── pages/
    ├── LoginPage.tsx           # Email + Password login with glassmorphic cards
    ├── OverviewDashboard.tsx   # Platform KPIs, run volume, user trends, charts
    └── users/
        ├── UsersLayout.tsx     # Secondary sidebar for User Management sub-pages
        ├── UsersOverview.tsx   # Visual charts for user registrations and plan distributions
        ├── UsersList.tsx       # Paginated table, search, filters, and "+ Add / Promote Admin" modal
        ├── OrganizationsList.tsx # Organization hierarchy, trial quota usage, seat count
        ├── ActivityLog.tsx     # Live stream of PR scans, commits, baseline audits
        ├── BetaCodes.tsx       # Complete management & analytics for Founder Beta Codes
        └── UserProfile.tsx     # Deep dive into individual user, repos, role changer, billing
```

---

## 7. 🎟️ Beta Codes Management & Analytics

The `BetaCodes.tsx` view supports comprehensive lifecycle controls:

1. **Auto-Generate**: Creates random high-entropy codes (e.g. `CW-BETA-XXXXXXXX`).
2. **Custom Create**: Set custom code name, plan (`pro` or `team`), `durationDays`, and `maxUses`.
3. **Edit Code**: Update any parameter (increase/decrease usage limit, change plan, extend duration).
4. **Discontinue / Re-activate**: Instant toggle switch between `Active` and `Discontinued`.
5. **Usage & Redemption Analytics**:
   - View visual progress bar (`usedCount / maxUses`).
   - Click the **BarChart icon** to open the **Redemptions Modal**: inspect all organizations that redeemed the code, exact timestamp, trial expiry date, and active vs ended status.
6. **Remove / Delete**: Delete code with confirmation modal.

### Backend Endpoints Supporting This:
- `GET /api/admin/beta/codes` — List all codes
- `POST /api/admin/beta/codes` — Create code
- `PATCH /api/admin/beta/codes/:id` — Update parameters or active state
- `DELETE /api/admin/beta/codes/:id` — Permanently delete code
- `GET /api/admin/beta/codes/:id/redemptions` — View all redemptions for a specific code
- `GET /api/admin/beta/analytics` — Platform-wide KPI totals (active trials, total redemptions)

---

## 8. 🛠️ Development & Validation Workflow

When making modifications:

```powershell
# 1. Navigate to the admin folder
cd "c:\Users\pc\Desktop\codeward project\codeward-admin"

# 2. Run local dev server (default port: 5173 or 5175)
npm run dev

# 3. Always validate production build before pushing
npm run build

# 4. Commit and push strictly to the private admin remote
git add -A
git commit -m "feat/fix: <description>"
git push origin main
```
