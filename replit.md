# அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில் — Project Overview

A Tamil-language crowdfunding + content management website for the Sri Ayyappan Temple renovation (Kumbhabhishekam) project in Vadamathurai, Dindigul District, Tamil Nadu.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui (pnpm workspace: `@workspace/ayyappan-temple`)
- **Backend**: Express 5 API server (pnpm workspace: `@workspace/api-server`)
- **Database**: Replit PostgreSQL via Drizzle ORM (pnpm workspace: `@workspace/db`)
- **Monorepo**: pnpm workspaces

## How to Run

Both workflows are managed by Replit:
- **Temple website**: `artifacts/ayyappan-temple: web` → preview at `/`
- **API server**: `artifacts/api-server: API Server` → preview at `/api`

## Key Features

### Public Site
- Temple info pages (history, gurus, renovation, Kumbhabhishekam, gallery)
- Live crowdfunding progress bar with real donation stats
- QR/UPI donation submission form (with donor name, mobile, transaction ID)
- Approved donors list (publicly visible after admin verification)
- Bank details and QR code managed from admin panel

### Admin Panel (`/admin`)
- **Login**: `/admin` — username: `admin`, password: `admin123` (change after first login)
- **Dashboard**: `/admin/dashboard` — crowdfunding stats, recent donations
- **Donations**: `/admin/donations` — approve/reject pending donations
- **News**: `/admin/news` — create/edit/delete announcements
- **Events**: `/admin/events` — manage temple events (pujas, festivals)
- **Settings**: `/admin/settings` — bank details, QR code URL, temple timings
- **Admin Users**: `/admin/admins` — create new admins (super_admin only)

### Roles
- `super_admin` — full access
- `editor` — news, events, settings, donation approve/reject
- `volunteer` — can only view/submit donations, cannot approve

## Database Tables
- `admins` — admin users with roles
- `donations` — donation submissions (pending → approved/rejected)
- `news_posts` — announcements
- `events` — temple events
- `gallery_albums` / `gallery_photos` — photo gallery
- `site_settings` — CMS key-value store (bank details, QR code, etc.)
- `audit_logs` — admin action logs
- `sessions` — express-session store (auto-created by connect-pg-simple)

## Default Admin
- Username: `admin`
- Password: `admin123`
- Role: `super_admin`

**Change this password immediately after first login.**

## User Preferences
- Keep Tamil language text intact throughout the UI
- All public-facing content should be in Tamil; admin UI can be bilingual
