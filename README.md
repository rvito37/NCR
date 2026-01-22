# Case Management System with Supabase

A full-stack Next.js application for managing cases with role-based access control, built with TypeScript, Tailwind CSS, and Supabase.

## Features

- **Role-Based Access Control (RBAC)**
  - Admin: Full system access, user management
  - Manager: Can manage team cases and view reports
  - Analyst: Can create and edit assigned cases
  - Viewer: Read-only access to assigned cases

- **Case Management**
  - Create, read, update, and delete cases
  - Assign cases to team members
  - Track case status and priority
  - Add comments and notes to cases
  - Complete activity logging

- **Security**
  - Secure authentication with Supabase Auth
  - Row-level security (RLS) in database
  - Permission-based access control
  - Audit trail of all activities

- **User Interface**
  - Responsive design with Tailwind CSS
  - Dashboard with case statistics
  - Cases list with filtering and sorting
  - Case details with activity timeline
  - Real-time comments

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **HTTP Client**: Axios

## Prerequisites

- Node.js 18+ and npm
- Supabase account (https://supabase.com)

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Project Settings > API to get your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anonymous key

3. Update `.env.local` with your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialize the database

1. Go to Supabase SQL Editor
2. Copy the contents of `schema.sql` from the root directory
3. Paste and execute the SQL in the Supabase SQL Editor
4. The schema will create:
   - Users table with role management
   - Cases table with status and priority tracking
   - Case comments and activity logs
   - Row-level security policies
   - Default case statuses

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Landing page
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard with statistics
│   ├── cases/
│   │   ├── page.tsx            # Cases list with filters
│   │   ├── [id]/
│   │   │   └── page.tsx        # Case details with comments
│   │   └── new/
│   │       └── page.tsx        # Create new case
│   └── auth/
│       ├── login/
│       │   └── page.tsx        # Login page
│       └── signup/
│           └── page.tsx        # Sign up page
├── components/
│   ├── Button.tsx              # Reusable button component
│   ├── FormElements.tsx        # Form inputs, selects, textareas
│   └── Navigation.tsx          # Top navigation bar
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   ├── types.ts               # TypeScript types and interfaces
│   ├── api.ts                 # API functions and database queries
│   ├── store.ts               # Zustand stores for state management
│   └── auth-context.tsx       # React context for authentication
└── globals.css                # Global styles
```

## User Roles and Permissions

### Admin
- View all cases
- Create, edit, and delete cases
- Assign cases to team members
- Manage user roles
- View all reports and analytics

### Manager
- View all cases in their team
- Create and edit assigned cases
- Assign cases to team members
- View team reports

### Analyst
- View only assigned cases
- Create new cases
- Edit their own cases
- Add comments to cases

### Viewer
- View only assigned cases
- Add comments
- View basic reports

## Database Schema

### Users Table
- `id` (UUID): User ID from Supabase Auth
- `email` (VARCHAR): User email
- `display_name` (VARCHAR): User's display name
- `role` (VARCHAR): User role (admin, manager, analyst, viewer)
- `is_active` (BOOLEAN): Account status
- `created_at` (TIMESTAMP): Account creation date

### Cases Table
- `id` (UUID): Case ID
- `title` (VARCHAR): Case title
- `description` (TEXT): Case description
- `status_id` (UUID): Foreign key to case_statuses
- `priority` (VARCHAR): Priority level (low, medium, high, critical)
- `assigned_to` (UUID): User ID of assignee
- `created_by` (UUID): User ID of creator
- `created_at` (TIMESTAMP): Creation date
- `updated_at` (TIMESTAMP): Last update date

### Case Statuses Table
- `id` (UUID): Status ID
- `name` (VARCHAR): Status name (Open, In Progress, On Hold, Resolved, Closed)
- `color` (VARCHAR): Hex color for UI display
- `order` (INTEGER): Sort order

### Case Comments Table
- `id` (UUID): Comment ID
- `case_id` (UUID): Foreign key to cases
- `user_id` (UUID): Comment author
- `content` (TEXT): Comment text
- `created_at` (TIMESTAMP): Creation date

### Case Activity Table
- `id` (UUID): Activity ID
- `case_id` (UUID): Foreign key to cases
- `user_id` (UUID): User who performed action
- `action` (VARCHAR): Action type
- `description` (TEXT): Action description
- `timestamp` (TIMESTAMP): When action occurred

## API Functions

The `lib/api.ts` file provides functions for:

**Authentication**
- `getCurrentUser()`: Get current authenticated user
- `signIn(email, password)`: Sign in user
- `signUp(email, password, displayName)`: Create new account
- `signOut()`: Sign out user

**Users**
- `getUser(userId)`: Get user details
- `updateUserRole(userId, role)`: Update user role
- `getAllUsers()`: Get all users

**Cases**
- `getCase(caseId)`: Get case details
- `getCases(filters)`: Get cases with optional filters
- `createCase(...)`: Create new case
- `updateCase(caseId, updates, userId)`: Update case
- `deleteCase(caseId, userId)`: Delete case

**Comments & Activity**
- `getCaseComments(caseId)`: Get case comments
- `addComment(caseId, userId, content)`: Add comment
- `getCaseActivity(caseId)`: Get activity log
- `logCaseActivity(...)`: Log activity

**Authorization**
- `checkPermission(role, permission)`: Check user permission
- `canEditCase(case, userId, role)`: Check if user can edit
- `canDeleteCase(userId, role)`: Check if user can delete
- `canViewAllCases(role)`: Check if user can view all cases

## Row-Level Security (RLS)

The database uses RLS policies to enforce access control:

- Users can view all user profiles
- Users can only update their own profile
- Admins can manage all users
- Users can only view cases they created, are assigned to, or manage
- Only admins can delete cases
- Comments and activity logs follow the same rules as cases

## Running in Production

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `your-key-here` |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Case Management System` |

## Customization

### Adding New Roles

1. Update `ROLE_PERMISSIONS` in `src/lib/types.ts`
2. Add role to the `CHECK (role IN (...))` constraint in `schema.sql`
3. Update the Select options in relevant components

### Styling

The application uses Tailwind CSS. Modify:
- `tailwind.config.ts`: Colors, spacing, fonts
- `src/app/globals.css`: Global styles
- Individual component classes: Utility classes

### Adding New Case Fields

1. Add column to `cases` table in `schema.sql`
2. Update `Case` type in `src/lib/types.ts`
3. Update forms and displays in components
4. Add to activity logging if needed

## Troubleshooting

**Issue**: "Missing Supabase environment variables"
- **Solution**: Ensure `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Issue**: "User not authenticated"
- **Solution**: Sign in through the login page or check that user is in the `users` table

**Issue**: "Permission denied" errors
- **Solution**: Check user role and RLS policies in Supabase SQL Editor

**Issue**: Cases not loading
- **Solution**: Verify database schema is correctly created by running `schema.sql`

## Support

For issues or questions:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check browser console for error messages
4. Verify Supabase project settings and credentials

## License

This project is open source and available under the MIT License.
