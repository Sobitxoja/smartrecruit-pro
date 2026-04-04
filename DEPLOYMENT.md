# SmartRecruit Pro - Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Resend Account**: Your API key is already configured
3. **Supabase Account**: Already configured ✅

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel Dashboard (Easiest)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables (see Step 3)
4. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 3: Add Environment Variables in Vercel

Go to your project settings in Vercel Dashboard → **Environment Variables** → Add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `re_Qhw5nmiP_8JEiEfoBBhYNdX7tbR9AKfc5` |
| `VITE_SUPABASE_URL` | `https://mwairqhejgdsfkxkwdre.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWlycWhlamdkc2ZreGt3ZHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzI2MjIsImV4cCI6MjA4NTI0ODYyMn0.T46vi1c0HTUxBzHtOcsf7qC1iqsZROehwT2HK2C64bs` |
| `GEMINI_API_KEY` | `AIzaSyCZJxPPl5oMTm7pN8b_FSZOHU_oox3kp_A` |

⚠️ **Important**: Add variables for **Production**, **Preview**, and **Development** environments.

---

## ⚠️ Important Notes

### Email Verification Limitation

Your current Resend account is in **test mode**. It will only send emails to:
- ✅ `sobit.ortiqxojaev@gmail.com`

**To send to any email:**

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add and verify your domain (e.g., `yourdomain.com`)
3. Update `from` address in these files:
   - `api/verify/send.ts` (line 40)
   - `server.ts` (line 54)

Change from:
```typescript
from: 'sobit.ortiqxojaev@gmail.com',
```

To:
```typescript
from: 'noreply@yourdomain.com',  // Your verified domain email
```

### In-Memory Storage Warning

The current verification code system uses **in-memory storage** (`Map`). This works for local development but has limitations on Vercel:

- Codes may be lost between serverless invocations
- Not suitable for production with multiple users

**For production**, consider:
- Using Supabase to store verification codes
- Using Redis (Upstash, etc.)

---

## 🧪 Testing Locally

```bash
# Development mode (uses Express server)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🔗 After Deployment

Your app will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch.vercel.app`

---

## 🐛 Troubleshooting

### Email not sending?
- Check Resend dashboard at [resend.com](https://resend.com)
- Verify API key is correct
- Ensure recipient email is allowed in test mode

### Build fails?
- Run `npm run build` locally first
- Check TypeScript errors with `npm run lint`

### API routes not working?
- Check Vercel Function logs in the dashboard
- Ensure CORS is properly configured

---

## 📦 Project Structure

```
smartrecruit-pro/
├── api/                    # Vercel serverless functions
│   └── verify/
│       ├── send.ts        # POST /api/verify/send
│       ├── check.ts       # POST /api/verify/check
│       └── status.ts      # GET /api/verify/status
├── dist/                   # Production build output
├── index.html
├── index.tsx
├── App.tsx
├── server.ts              # Express server (local dev)
├── vite.config.ts
├── tailwind.config.js
└── vercel.json
```

---

## 🎯 Quick Deploy Command

```bash
vercel --prod
```

This deploys directly to production.
