# CybeHMS — Cybelinx Hospitality Management System

A **subscription-based** multi-tenant hospitality and facilities management platform serving Hotels, Serviced Apartments, Apartment Management (Rental), and Workplace Services verticals.

| | |
|---|---|
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · NeonDB (PostgreSQL) |
| **Architecture** | Schema-per-Tenant Multi-Tenancy |
| **Live** | https://ehms-app.vercel.app |
| **Git** | https://github.com/selva-aiprojects/ehms |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables (`.env.local`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
RESEND_API_KEY=re_...           # Transactional emails
RESEND_FROM=CybeHMS <...>          # Sender address
```

## Deploy on Vercel

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel --prod
```

> Email sending uses lazy initialization — if `RESEND_API_KEY` is not set, emails are skipped gracefully without crashing the build.

## Demo Users

Password for all: `Demo@1234`

| Role | Email |
|---|---|
| Super Admin | superadmin@ehms.demo |
| Property Manager | admin@ehms.demo |
| Executive | executive@ehms.demo |
| Front Desk | frontdesk@ehms.demo |
| Housekeeping | housekeeping@ehms.demo |
| Maintenance | maintenance@ehms.demo |
| HR Manager | hr@ehms.demo |
| Finance Manager | finance@ehms.demo |
