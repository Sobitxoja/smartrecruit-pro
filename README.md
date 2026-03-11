# SmartRecruit Pro - Recruitment Platform

A modern, full-featured recruitment platform built with React, Tailwind CSS, and Supabase.

## 🚀 Deployment to Vercel

This project is pre-configured for Vercel. 

### **1. Push to GitHub**
1. Create a new repository on GitHub.
2. Upload all project files (except `node_modules`).

### **2. Connect to Vercel**
1. Go to [Vercel.com](https://vercel.com) and import your repository.
2. **IMPORTANT**: Add these Environment Variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

## 🤖 AI Features (Gemini)

This project uses Google Gemini AI for:
- **Smart Match**: Automatically matching candidates to job postings.
- **Resume Parsing**: Extracting data from PDF/DOCX resumes to auto-fill profiles.

### **Setup AI**
1. Get a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
2. Add it to your environment variables:
   - Local: Add `GEMINI_API_KEY=your_key` to `.env`.
   - Vercel: Add `GEMINI_API_KEY` in the project settings.

---

## 🗄️ Supabase Database Setup

To use the persistence features, you need to create the following tables in your Supabase SQL Editor:

```sql
-- 1. Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company_name TEXT,
  bio TEXT,
  company_location TEXT,
  skills TEXT[],
  applied_job_ids TEXT[],
  preferred_role TEXT,
  open_to_relocation BOOLEAN,
  experience_list JSONB,
  preferred_locations JSONB,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Jobs Table
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  employer_id TEXT REFERENCES users(id),
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  salary TEXT NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  experience_required JSONB,
  locations JSONB
);

-- 3. Applications Table
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  seeker_id TEXT REFERENCES users(id),
  status TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  messages JSONB
);

-- Enable RLS (Row Level Security) - Optional but recommended
-- For a quick start, you can disable RLS or add broad policies.
```

---

## 🛠️ Local Development

If you want to run the project on your own computer:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   *Note: I have downgraded the project to **React 18** to ensure maximum compatibility with all libraries.*

2. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## 📦 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Database/Auth**: Supabase
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
