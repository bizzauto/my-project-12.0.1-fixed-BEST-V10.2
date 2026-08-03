# 🚀 BizzAuto CRM - Production Deployment Guide

## Problem
App works locally but not online because the backend **refuses to start** in production due to missing environment variables.

## Root Cause
The backend has strict startup validation (`src/server/middleware/env-hardening.ts`) that calls `process.exit(1)` if required secrets are missing.

---

## Step 1: Set Environment Variables in Coolify

Go to your Coolify dashboard → Backend Service → Environment Variables

Add these **REQUIRED** variables:

### 🔐 Security Secrets (CRITICAL - generate your own!)

```bash
# Generate secrets locally (run in terminal):
openssl rand -hex 32    # Run 4 times for each secret
```

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | *(64 hex chars)* | Min 32, recommended 64 |
| `JWT_REFRESH_SECRET` | *(64 hex chars)* | Min 32, recommended 64 |
| `ENCRYPTION_KEY` | *(64 hex chars)* | Exactly 64 hex chars |
| `RESELLER_JWT_SECRET` | *(64 hex chars)* | Must be different from JWT_SECRET |

### 🌐 Server Config

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `HOST` | `0.0.0.0` |

### 🔗 Frontend & CORS

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://bizzautoai.com` |
| `BASE_URL` | `https://bizzautoai.com` |
| `CORS_ORIGIN` | `https://bizzautoai.com,https://www.bizzautoai.com` |

### 🗄️ Database

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://supabase_admin:3RY07i5nk2qLT39DMnf2VW5I0DZuR436@supabase-db-ls3ehizkv5guirww9wlazwrv:5432/postgres?schema=public` |

### 🔑 Auth

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | `bizzbills-local-secret-change-in-prod` |
| `NEXTAUTH_URL` | `https://bizzautoai.com` |
| `CRON_SECRET` | `bizzbills-cron-secret` |

### 📧 Email (Optional - needed for transactional emails)

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | *(your SMTP host)* |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | *(your SMTP user)* |
| `SMTP_PASS` | *(your SMTP password)* |

### 💳 Payments (Optional - needed for Razorpay)

| Variable | Value |
|----------|-------|
| `RAZORPAY_KEY_ID` | *(your Razorpay key)* |
| `RAZORPAY_KEY_SECRET` | *(your Razorpay secret)* |

### 🤖 AI Services (Optional)

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | *(your OpenAI key)* |
| `ANTHROPIC_API_KEY` | *(your Anthropic key)* |

---

## Step 2: Set Frontend Environment Variables in Coolify

Go to Frontend Service → Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | *(leave empty or set to `/api`)* |

---

## Step 3: Redeploy

After setting all environment variables in Coolify:

1. **Save** all environment variables
2. **Redeploy** the backend service first
3. **Redeploy** the frontend service
4. **Check logs** for both services

### Verify Backend is Running

```bash
# Check health endpoint
curl https://bizzautoai.com/health

# Should return:
# {"status":"ok","timestamp":"...","environment":"production","version":"12.0.1"}
```

---

## Step 4: If Backend Still Fails

Check Coolify logs for these errors:

### "FATAL: Production environment is misconfigured"
→ Missing required env vars. Add them in Step 1.

### "ENCRYPTION_KEY must be exactly 64 hex characters"
→ Generate a valid key: `openssl rand -hex 32`

### "JWT_SECRET contains default/weak value"
→ Use the generated secrets, not placeholder values.

### Database connection error
→ Verify `DATABASE_URL` is correct and the database is accessible from the VPS.

---

## Step 5: Generate Fresh Secrets (Recommended)

For maximum security, generate NEW secrets instead of using the ones in `.env`:

```bash
# Run these 4 commands and copy each output to Coolify
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
openssl rand -hex 32   # RESELLER_JWT_SECRET
```

---

## SSH Key (for VPS access)

Your VPS SSH key is at: `C:\Users\HP\.ssh\vps_key`

To connect:
```bash
ssh -i C:\Users\HP\.ssh\vps_key root@your-vps-ip
```

---

## Architecture

```
Internet → Nginx (port 80/443) → Frontend (static files)
                                → /api/* → Backend (port 4000)
                                           → PostgreSQL (Supabase)
```

- **Frontend**: Vite + React, served by Nginx
- **Backend**: Express.js + Prisma, runs on port 4000
- **Database**: PostgreSQL via Supabase self-hosted
- **SSL**: Let's Encrypt certificates
