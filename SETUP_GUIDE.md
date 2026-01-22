# Case Management System - Complete Setup Guide

This guide provides step-by-step instructions to set up and deploy the Case Management System application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Environment Configuration](#environment-configuration)
5. [Database Initialization](#database-initialization)
6. [Running the Application](#running-the-application)
7. [Creating Test Data](#creating-test-data)
8. [Deployment](#deployment)

## Prerequisites

Before starting, ensure you have:

- **Node.js**: Version 18 or higher
  - Download from https://nodejs.org/
  - Verify installation: `node --version`

- **npm**: Version 9 or higher
  - Usually installed with Node.js
  - Verify: `npm --version`

- **Git**: For version control (optional)
  - Download from https://git-scm.com/

- **Supabase Account**: Free account at https://supabase.com
  - Sign up with GitHub or email

- **Text Editor**: VS Code recommended
  - Download from https://code.visualstudio.com/

## Initial Setup

### Step 1: Navigate to Project Directory

```powershell
cd "c:\Users\rvito\Documents\ncr"
```

### Step 2: Install Dependencies

All required packages are already configured in `package.json`. Install them with:

```bash
npm install
```

This will install:
- **next**: React framework
- **react**: UI library
- **typescript**: Type safety
- **tailwindcss**: CSS framework
- **@supabase/supabase-js**: Supabase client
- **zustand**: State management
- **axios**: HTTP client
- And other utilities

Expected output should show "added X packages" without errors.

## Supabase Configuration

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project" or sign in if needed
3. Fill in project details:
   - **Name**: `case-management` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Wait for project to be created (2-3 minutes)

### Step 2: Get API Credentials

1. In Supabase dashboard, go to **Settings > API**
2. Under "Project API keys":
   - Copy **Project URL** (looks like `https://your-project.supabase.co`)
   - Copy **Public (anon key)** (long string of characters)
3. Save these safely - you'll need them in the next step

### Step 3: Enable Necessary Extensions

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Run these commands to enable required extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Environment Configuration

### Step 1: Create `.env.local` File

In the project root directory (c:\Users\rvito\Documents\ncr), create a file named `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Case Management System
```

Replace:
- `your-project.supabase.co` with your actual Supabase URL
- `your-anon-key-here` with your actual public key

### Step 2: Verify Environment Variables

Check that `.env.local` was created correctly:

```bash
cat .env.local
```

You should see your credentials (sensitive info, don't commit to git).

## Database Initialization

### Step 1: Access Supabase SQL Editor

1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Create Tables and Schema

1. Open the `schema.sql` file from the project root
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)

The script will create:
- **users** table with role management
- **case_statuses** table with default statuses (Open, In Progress, On Hold, Resolved, Closed)
- **cases** table for case management
- **case_comments** table for discussions
- **case_activity** table for audit logs
- **Row-Level Security (RLS)** policies for data protection
- **Indexes** for performance optimization

Expected result: All queries execute successfully with no errors.

### Step 3: Verify Tables Were Created

1. Go to **Table Editor** in Supabase
2. You should see these new tables:
   - cases
   - case_activity
   - case_comments
   - case_statuses
   - users

### Step 4: Set Up Authentication

1. Go to **Authentication > Policies** in Supabase
2. Ensure "Enable email confirmations" is set (can be disabled for development)
3. Go to **Email Templates** tab
4. Verify confirmation email template exists

## Running the Application

### Step 1: Start Development Server

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Step 2: Access the Application

1. Open your browser
2. Go to http://localhost:3000
3. You should see the landing page with:
   - "Case Management System" heading
   - Description and features
   - "Sign In" and "Create Account" buttons

### Step 3: Create Your First Account

1. Click "Create Account"
2. Fill in:
   - Display Name: Your name
   - Email: Your email
   - Password: Strong password (min 6 chars)
   - Confirm Password: Same password
3. Click "Create Account"
4. Check email for confirmation (if enabled)
5. Click "Sign In"
6. Enter your credentials

### Step 4: Verify You're Logged In

After successful login, you should see:
- Navigation bar with your email and role
- Dashboard with statistics
- "New Case" button
- Case statistics showing 0 cases

## Creating Test Data

### Step 1: Create First Case

1. Click "New Case" button
2. Fill in form:
   - **Title**: "Client Inquiry - Product Setup"
   - **Description**: "Client needs help setting up the product"
   - **Priority**: "High"
   - **Status**: "Open"
   - **Assign To**: Leave empty (you'll assign later)
3. Click "Create Case"
4. You'll be taken to case details page

### Step 2: Add a Comment

1. Scroll to "Comments" section
2. Type: "Reached out to client for more details"
3. Click "Add Comment"
4. Comment appears with timestamp

### Step 3: Update Case Status

1. In the right sidebar, find "Status" dropdown
2. Change from "Open" to "In Progress"
3. Status updates immediately
4. See activity log updated

### Step 4: Create More Test Cases

Repeat Step 1 with different cases:
- "Bug Report - Login Issues"
- "Feature Request - Export to PDF"
- "Support Ticket - Password Reset"

### Step 5: View Cases in Dashboard

1. Click "Dashboard" in navigation
2. See statistics:
   - Total Cases: 4
   - Assigned to You: 0 (if unassigned)
   - Created by You: 4
3. See cases grouped by status

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/case-management.git
   git push -u origin main
   ```

2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Get your production URL

### Update Supabase Settings

1. Go to Supabase **Settings > Authentication > Providers**
2. Update "Site URL" to your Vercel URL
3. Update "Redirect URLs" to include:
   - `https://your-vercel-url.vercel.app/auth/callback`

## Troubleshooting

### Problem: "Missing Supabase environment variables"

**Solution**:
1. Check `.env.local` exists in project root
2. Verify format (no quotes around values)
3. Restart dev server: `npm run dev`

### Problem: Cannot sign up / "Email already exists"

**Solution**:
1. Check if user exists in Supabase
2. Delete test accounts in Supabase **Authentication > Users** tab
3. Try again with different email

### Problem: "Row level security" or "Permission denied" errors

**Solution**:
1. Verify `schema.sql` was fully executed
2. Check RLS policies are enabled in Supabase
3. Go to **SQL Editor** and run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'cases';
   ```

### Problem: "No cases showing" even after creating them

**Solution**:
1. Verify user is in the `users` table
2. Check user has correct role
3. Verify RLS is enabled on cases table
4. Try refreshing the page (Ctrl+R)

### Problem: Development server not starting

**Solution**:
1. Kill existing process: `lsof -ti:3000 | xargs kill -9`
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Restart: `npm run dev`

## Next Steps

1. **Add more users**: Create accounts with different roles
2. **Customize styling**: Edit colors in `tailwind.config.ts`
3. **Add team members**: Manage users in Supabase
4. **Set up email templates**: Customize auth emails in Supabase
5. **Configure backup**: Set up automated backups in Supabase

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

## Summary

Your Case Management System is now ready! Key features:

✅ User authentication with Supabase  
✅ Role-based access control (Admin, Manager, Analyst, Viewer)  
✅ Create, read, update cases  
✅ Add comments to cases  
✅ Track case activity  
✅ Filter and search cases  
✅ Real-time updates  
✅ Responsive design  
✅ Production-ready code  

Happy case managing!
