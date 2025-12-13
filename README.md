# 🎄 Christmas Gift Tracker

A private, household-friendly Christmas gift tracking app designed for couples and families.

Track gift ideas, purchases, wrapping status, and budgets — year over year — without spreadsheets, shared notes, or surprises.

Built as a modern SaaS-style web app using Supabase and deployed on Vercel.

---

## ✨ Features

- 🔐 Email/password authentication (Supabase Auth)
- 👨‍👩‍👧 Household sharing with invites
- 🧑 People per list with optional budgets
- 🎁 Gift ideas vs purchased tracking
- 🎀 Wrapping status tracking
- 💰 Automatic totals per person and per list
- 📆 Year-based lists (e.g. Christmas 2025)
- 🔄 Duplicate lists for next year (planned)
- 📱 Installable PWA (mobile-friendly)
- 🔒 Secure Row Level Security (RLS)

---

## 🏗 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Hosting**: Vercel
- **Local Dev**: Docker Compose
- **PWA**: Vite PWA plugin

---

## 🚀 Local Development

### 1. Clone the repo
```bash
git clone https://github.com/andrewpark3412/gift-tracking.git
cd gift-tracking
