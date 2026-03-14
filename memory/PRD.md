# EcoRent UK - Product Requirements Document

## Project Overview
**Name:** EcoRent UK  
**Type:** Property Management SaaS  
**Status:** MVP with Production Features  
**Last Updated:** January 2026

## Original Problem Statement
Build a comprehensive, full-stack Property Management SaaS called 'EcoRent UK' using a 'Tactile Maximalism' design style with:
- Interactive UI with Framer Motion animations and 3D glassmorphism hero card
- Scroll-storytelling landing page
- Interactive dashboard with sustainability tracker and tenant chat
- Lead capture with email notifications
- UK localization (British English, GBP, Section 21/EPC regulations)

## User Personas
1. **UK Landlords** - Private property owners managing 1-10 rental properties
2. **Property Managers** - Professionals managing portfolios for multiple clients
3. **Letting Agents** - Estate agents handling lettings and property management
4. **Buy-to-Let Investors** - Investors focused on rental income and compliance

## Core Requirements (Phase 1 - Complete)
- [x] Landing page with 3D glassmorphism hero card (mouse tracking)
- [x] Scroll-storytelling sections
- [x] Lead capture form with backend storage
- [x] User authentication (Email/Password + Google OAuth)
- [x] Property listings CRUD with EPC rating fields
- [x] Sustainability tracker (EPC scores, HEM calculator)
- [x] AI-powered tenant chat (Claude Sonnet 4.5)
- [x] Dashboard with analytics
- [x] UK localization (GBP, British English)
- [x] Section 21 and EPC regulation information

## Production Features (Phase 2 - Complete)
- [x] Change Password functionality
- [x] Delete Account with data cleanup
- [x] Two-Factor Authentication (TOTP with authenticator apps)
- [x] Notification settings persistence (MongoDB)
- [x] Chat message deletion (individual)
- [x] Clear chat history
- [x] Test Notification button (Resend)
- [x] Compliance Score widget in dashboard
- [x] "Get Started" button (replaced "Start Free Trial")

## What's Been Implemented

### Backend (FastAPI + MongoDB)
**Authentication:**
- Email/Password registration & login
- Google OAuth
- Session management with secure cookies
- Password change endpoint
- Account deletion (cascades to all user data)
- TOTP-based 2FA setup, verification, disable

**User Settings:**
- GET/PUT /api/user/settings
- Notification preferences persisted to DB
- Theme preferences support

**Properties:**
- Full CRUD with EPC ratings
- Support for green features (solar, heat pump)
- Insulation type tracking

**Chat:**
- AI-powered categorization (Urgent/Standard/Inquiry)
- Individual message deletion
- Clear all history

**Dashboard:**
- Stats with compliance calculations
- Compliant vs non-compliant property counts
- Compliance percentage

**Notifications:**
- Test notification endpoint
- Resend email integration ready

### Frontend (React + Tailwind CSS)
**Pages:**
- Landing page with scroll storytelling
- Login/Register with Google OAuth
- Dashboard with sidebar layout
- Properties management
- Sustainability tracker with HEM calculator
- Tenant chat with AI responses
- Leads management
- Settings (Security, Notifications, Profile)

**Features:**
- Framer Motion animations
- Glassmorphism design
- Circular progress indicators
- Compliance Score widget
- Notification toggles with persistence

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, Framer Motion, Shadcn UI, Recharts
- **Backend:** FastAPI, Motor (async MongoDB), pyotp (2FA)
- **Database:** MongoDB
- **Auth:** JWT sessions + Emergent Google OAuth + TOTP 2FA
- **AI:** Claude Sonnet 4.5 via Emergent Integrations
- **Email:** Resend (ready, requires API key)
- **Styling:** Custom CSS with glassmorphism effects

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Core authentication flow
- [x] Property management CRUD
- [x] Landing page design
- [x] Account management (password, delete, 2FA)
- [x] Settings persistence
- [x] Compliance Score widget

### P1 (High Priority) - NEXT
- [ ] Cloudinary image upload for properties
- [ ] Email notifications for leads (requires Resend API key)
- [ ] Mobile responsive refinements
- [ ] QR code display for 2FA setup

### P2 (Medium Priority)
- [ ] Tenant management system
- [ ] Rent payment tracking
- [ ] Document storage (tenancy agreements)
- [ ] Property maintenance requests

### P3 (Lower Priority)
- [ ] Multi-user access (teams)
- [ ] PDF report generation
- [ ] Advanced analytics dashboard
- [ ] Integration with Rightmove/Zoopla
- [ ] Stripe payment integration (when requested)

## API Keys Required
- **RESEND_API_KEY** - For email notifications
- **CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET** - For image uploads

## Next Tasks
1. Configure Resend API key for email notifications
2. Add Cloudinary credentials for property images
3. Implement QR code library for 2FA setup display
4. Add tenant management feature
5. Implement rent payment tracking
