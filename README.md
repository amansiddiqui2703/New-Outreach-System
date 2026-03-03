# AutoMindz — Email Outreach + Contact Finder

AI-powered email outreach platform with built-in contact finder, tracking, and multi-Gmail support.

## Features

- **Bulk & Single Email Sending** via Gmail API (OAuth2)
- **AI Email Composer** powered by Google Gemini
- **Rich Text Editor** with merge tags, HTML mode, and preview
- **Contact Finder** — crawl websites for publicly visible emails
- **Tracking** — open tracking, click tracking, unsubscribe
- **Multi-Gmail Account** support with automatic rotation
- **Campaign Management** — draft, schedule, pause, resume, A/B test
- **Analytics Dashboard** with charts
- **Dark/Light Mode** UI
- **GDPR-ready** contact management
- **Docker-ready** deployment

## 🚀 Quick Start (Super Easy!)

### Prerequisites

- [Node.js 20+](https://nodejs.org) — download and install
- [MongoDB](https://www.mongodb.com/try/download/community) — running locally or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- [Redis](https://github.com/tporadowski/redis/releases) — download Redis for Windows

### Step 1: Configure `.env`

Open the `.env` file and fill in your credentials:

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `JWT_SECRET` | Any random string (e.g., `mysecretkey123`) |

### Step 2: Run!

**Just double-click `start.bat`** — that's it! 🎉

It will:
- ✅ Check if Node.js is installed
- ✅ Auto-install dependencies (first time only)
- ✅ Start the backend server
- ✅ Start the frontend
- ✅ Open your browser to http://localhost:5173

### Other Scripts

| Script | What it does |
|---|---|
| `start.bat` | 🚀 Start everything (double-click to run) |
| `stop.bat` | 🛑 Stop all running servers |
| `install.bat` | 📦 Manually install/update dependencies |

### Manual Start (if you prefer)

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Visit http://localhost:5173

### Docker

```bash
docker-compose up --build
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `JWT_SECRET` | Secret for JWT tokens |
| `ENCRYPTION_KEY` | AES-256 key for token encryption |

## Tech Stack

**Backend:** Node.js, Express, Mongoose, Nodemailer, Bull, Redis
**Frontend:** React (Vite), TailwindCSS v4, TipTap, Recharts
**Database:** MongoDB
**AI:** Google Gemini
