# EcoRent UK

A full-stack Property Management SaaS built for UK landlords. Manage properties, track EPC sustainability scores, communicate with tenants, and capture leads — all in one place.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Motor-brightgreen) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue)

---

## Features

- Email/Password & Google OAuth authentication
- Two-Factor Authentication (TOTP)
- Property listings with EPC ratings and green features (solar, heat pump)
- Sustainability tracker with HEM calculator
- Tenant portal with AI-powered chat
- Lead capture with email notifications (Resend)
- Property image uploads (Cloudinary)
- Dashboard with compliance score and analytics
- UK localisation (GBP, British English, Section 21 / EPC regulations)
- Glassmorphism UI with Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn UI, Framer Motion, Recharts |
| Backend | FastAPI, Motor (async MongoDB) |
| Database | MongoDB |
| Auth | Session-based JWT + Google OAuth + TOTP 2FA |
| Email | Resend |
| Images | Cloudinary |

---

## Project Structure

```
EcoRentUK/
├── backend/
│   ├── server.py          # FastAPI app — all API routes
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container image
│   └── .env.example       # Backend env template
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route-level components
│   │   ├── components/    # Shared UI components (Shadcn)
│   │   ├── context/       # AuthContext (Google OAuth + session)
│   │   └── hooks/         # Custom hooks
│   ├── Dockerfile         # Frontend container image (Nginx)
│   ├── nginx.conf         # Nginx config for SPA routing
│   ├── package.json
│   └── .env.example       # Frontend env template
├── docker-compose.yml     # Run everything with one command
├── render.yaml            # One-click Render.com deployment
└── README.md
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally (`mongodb://localhost:27017`)
- A Google OAuth 2.0 Client ID ([create one here](https://console.cloud.google.com))

---

## Installation & Setup

### 1. Clone the repo

```bash
git clone https://github.com/gitbasitmalik/EcoRentUK.git
cd EcoRentUK
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
pip3 install -r requirements.txt

# Copy env template and fill in your values
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=any_random_secret_string
CLOUDINARY_CLOUD_NAME=        # optional — for image uploads
CLOUDINARY_API_KEY=           # optional
CLOUDINARY_API_SECRET=        # optional
RESEND_API_KEY=               # optional — for email notifications
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Copy env template and fill in your values
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

### 4. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000` to **Authorized JavaScript origins**
4. Add `http://localhost:3000` to **Authorized redirect URIs**
5. Copy the Client ID into both `.env` files above

---

## Running the Project

### Start the backend

```bash
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend runs at: `http://localhost:8001`  
API docs at: `http://localhost:8001/docs`

### Start the frontend

```bash
cd frontend
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Test Accounts

Two accounts are auto-created on first backend startup:

| Role | Email | Password |
|------|-------|----------|
| Landlord | admin@test.com | admin123 |
| Tenant | tenant@test.com | tenant123 |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name |
| `CORS_ORIGINS` | Yes | Frontend URL for CORS |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `JWT_SECRET` | Yes | Secret for session tokens |
| `CLOUDINARY_*` | No | For property image uploads |
| `RESEND_API_KEY` | No | For email notifications |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_BACKEND_URL` | Yes | Backend API base URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |

---

## License

MIT

---

## Deployment

### Option A — Docker Compose (self-hosted / VPS)

The fastest way to run EcoRent UK in production on any server with Docker installed.

```bash
# 1. Fill in your environment variables
cp backend/.env.example backend/.env   # edit with real values
cp frontend/.env.example frontend/.env # edit with real values

# 2. Build images and start all services (MongoDB + backend + frontend)
docker compose up --build -d

# Frontend → http://localhost:3000
# Backend  → http://localhost:8001
# API docs → http://localhost:8001/docs
```

To stop:

```bash
docker compose down
```

> **Tip:** MongoDB data is persisted in the `mongo_data` Docker volume.
> To wipe the database run `docker compose down -v`.

---

### Option B — Render.com (free cloud hosting)

Render can host the backend (Python web service) and frontend (static site) for free. For the database, use the free [MongoDB Atlas M0 cluster](https://www.mongodb.com/atlas) (no credit card required).

1. **Create a MongoDB Atlas cluster** (free M0 tier):
   - Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Create a free cluster, add a database user, and allow access from all IPs (`0.0.0.0/0`).
   - Copy the connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/ecorentuk`).

2. Fork / push this repo to your GitHub account.
3. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint Instance**.
4. Connect your GitHub repo — Render will detect `render.yaml` and provision both services automatically.
5. In the Render dashboard set the following **secret** environment variables on the `ecorentuk-backend` service (they are marked `sync: false` in `render.yaml`):

   | Variable | Where to get it |
   |----------|-----------------|
   | `MONGO_URL` | MongoDB Atlas connection string |
   | `CORS_ORIGINS` | Your Render frontend URL (e.g. `https://ecorentuk-frontend.onrender.com`) |
   | `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) |
   | `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
   | `CLOUDINARY_CLOUD_NAME` | [Cloudinary](https://cloudinary.com) (optional) |
   | `CLOUDINARY_API_KEY` | Cloudinary (optional) |
   | `CLOUDINARY_API_SECRET` | Cloudinary (optional) |
   | `RESEND_API_KEY` | [Resend](https://resend.com) (optional) |
   | `ADMIN_EMAIL` | Your email address (optional) |

6. On the `ecorentuk-frontend` static site service set:

   | Variable | Value |
   |----------|-------|
   | `REACT_APP_BACKEND_URL` | Your Render backend URL (e.g. `https://ecorentuk-backend.onrender.com`) |
   | `REACT_APP_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

7. Update your Google OAuth app's **Authorized JavaScript origins** to include your Render frontend URL (e.g. `https://ecorentuk-frontend.onrender.com`).

`JWT_SECRET` is auto-generated by Render — you don't need to set it manually.

---

### Updating Google OAuth for production

Once deployed, add your production URLs to the Google Cloud Console OAuth app:

- **Authorized JavaScript origins**: `https://your-frontend-url.onrender.com`
- **Authorized redirect URIs**: `https://your-frontend-url.onrender.com`
