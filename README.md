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
│   └── .env.example       # Backend env template
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route-level components
│   │   ├── components/    # Shared UI components (Shadcn)
│   │   ├── context/       # AuthContext (Google OAuth + session)
│   │   └── hooks/         # Custom hooks
│   ├── package.json
│   └── .env.example       # Frontend env template
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
