# Architecture & File Reference

## Application Structure

### Root Directory Files

| File | Purpose |
|------|---------|
| `schema.sql` | Complete PostgreSQL database schema with RLS policies |
| `.env.example` | Environment variables template |
| `.env.local` | Environment configuration (not committed to git) |
| `package.json` | Project dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS customization |
| `postcss.config.js` | PostCSS configuration for Tailwind |
| `README.md` | Project overview and quick start |
| `SETUP_GUIDE.md` | Detailed step-by-step setup instructions |
| `IMPLEMENTATION_SUMMARY.md` | Complete implementation details |

## Source Code Structure

### Core Application Files

#### `src/app/` - Page Components

| File | Purpose | Features |
|------|---------|----------|
| `layout.tsx` | Root layout wrapper | Auth provider, navigation, loading states |
| `page.tsx` | Landing page | Feature highlights, CTA buttons |
| `globals.css` | Global styles | Tailwind imports, base styles |

#### `src/app/auth/` - Authentication Pages

| File | Purpose | Features |
|------|---------|----------|
| `login/page.tsx` | Login page | Email/password form, error handling |
| `signup/page.tsx` | Sign up page | User registration, validation |

#### `src/app/cases/` - Case Management Pages

| File | Purpose | Features |
|------|---------|----------|
| `page.tsx` | Cases list | Filtering, sorting, table display |
| `new/page.tsx` | Create case form | Case creation with all fields |
| `[id]/page.tsx` | Case details | Comments, activity log, editing |

#### `src/app/dashboard/` - Dashboard

| File | Purpose | Features |
|------|---------|----------|
| `page.tsx` | Dashboard | Statistics, case overview by status |

### Component Library - `src/components/`

| File | Components | Purpose |
|------|-----------|---------|
| `Button.tsx` | `Button` | Reusable button with variants (primary, secondary, danger, ghost) |
| `FormElements.tsx` | `Input`, `Select`, `Textarea` | Form controls with labels, error messages |
| `Navigation.tsx` | `Navigation` | Top navigation bar with user info and logout |

### Business Logic Layer - `src/lib/`

| File | Exports | Purpose |
|------|---------|---------|
| `supabase.ts` | `supabase` | Supabase client initialization |
| `types.ts` | TypeScript interfaces & types | `UserRole`, `Case`, `AuthUser`, `ROLE_PERMISSIONS` |
| `api.ts` | 30+ functions | All database operations and API calls |
| `store.ts` | Zustand stores | `useAuthStore`, `useCaseStore` |
| `auth-context.tsx` | `AuthProvider`, `useAuth` hook | Authentication context and provider |

## Component Relationships

```
App Root (layout.tsx)
├── AuthProvider (auth-context.tsx)
│   └── Navigation (Navigation.tsx)
│       ├── Landing Page (/)
│       ├── Auth Pages
│       │   ├── Login (/auth/login)
│       │   └── SignUp (/auth/signup)
│       ├── Dashboard (/dashboard)
│       └── Cases
│           ├── Cases List (/cases)
│           ├── Case Detail (/cases/[id])
│           └── Create Case (/cases/new)
```

## Data Flow

### Authentication Flow
1. User submits credentials on `/auth/login`
2. `signIn()` called from `api.ts`
3. Supabase authenticates via `supabase.auth.signInWithPassword()`
4. User stored in `useAuthStore`
5. `AuthProvider` loads user on app startup
6. Navigation updated with user info

### Case Management Flow
1. User navigates to `/cases`
2. `getCases()` fetches from Supabase
3. Cases stored in `useCaseStore`
4. Displayed in table with filtering
5. Click case → `/cases/[id]`
6. `getCase()` loads full details
7. User can comment, change status, assign

### State Management Flow
```
Component
  ↓
useAuth() or useCaseStore()
  ↓
Zustand Store
  ↓
API Functions (api.ts)
  ↓
Supabase Client
  ↓
PostgreSQL Database
```

## API Functions Organization

### Authentication (`auth-context.tsx`)
- `getCurrentUser()` - Get logged-in user
- `signIn()` - User login
- `signUp()` - User registration
- `signOut()` - User logout

### Users (api.ts)
- `getUser(userId)` - Get user profile
- `updateUserRole(userId, role)` - Change user role
- `getAllUsers()` - List all users

### Cases (api.ts)
- `getCase(caseId)` - Get single case
- `getCases(filters)` - Get cases with filters
- `createCase(...)` - Create new case
- `updateCase(caseId, updates, userId)` - Update case
- `deleteCase(caseId, userId)` - Delete case

### Case Status (api.ts)
- `getCaseStatuses()` - Get all statuses
- `getDefaultStatus()` - Get default status

### Comments (api.ts)
- `getCaseComments(caseId)` - Get comments
- `addComment(caseId, userId, content)` - Add comment

### Activity Logging (api.ts)
- `getCaseActivity(caseId)` - Get activity log
- `logCaseActivity(...)` - Log activity

### Authorization (api.ts)
- `checkPermission(role, permission)` - Check permission
- `canEditCase(case, userId, role)` - Check edit permission
- `canDeleteCase(userId, role)` - Check delete permission
- `canAssignCase(role)` - Check assign permission
- `canViewAllCases(role)` - Check view all permission

## Database Schema Organization

### Core Tables
- **users** - User accounts with authentication
- **case_statuses** - Status definitions
- **cases** - Main case records

### Relationship Tables
- **case_comments** - Comments on cases
- **case_activity** - Activity audit trail

### Indexes
- `idx_cases_status_id` - Query by status
- `idx_cases_assigned_to` - Query by assignee
- `idx_cases_created_by` - Query by creator
- `idx_case_comments_case_id` - Query comments
- `idx_case_activity_case_id` - Query activities
- `idx_users_role` - Query by role

### RLS Policies
- Users can view all user profiles
- Users can update own profile
- Admins can manage users
- Users can view authorized cases
- Users can update authorized cases
- Only admins can delete cases
- Comments follow case permissions

## Type System

### User Roles
```typescript
type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer'
```

### Case Priority
```typescript
type Priority = 'low' | 'medium' | 'high' | 'critical'
```

### Main Interfaces
- `AuthUser` - Authenticated user
- `Case` - Case record
- `CaseStatus` - Status definition
- `CaseComment` - Comment record
- `CaseActivity` - Activity log entry
- `RolePermission` - Role permission mapping

## Styling System

### Tailwind CSS
- Colors: Blue, Green, Red, Orange, Gray
- Spacing: Standard Tailwind scale
- Typography: Geist font family
- Components: Rounded corners, shadows, borders

### Component Variants
```typescript
// Button variants
'primary' | 'secondary' | 'danger' | 'ghost'

// Button sizes
'sm' | 'md' | 'lg'
```

## Environment Configuration

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public authentication key

### Optional Variables
- `NEXT_PUBLIC_API_URL` - API endpoint (default: localhost:3000)
- `NEXT_PUBLIC_APP_NAME` - Application name

## Development Workflow

### Adding a New Feature

1. **Create API Function** (`lib/api.ts`)
   - Add Supabase query
   - Add error handling
   - Add TypeScript types

2. **Update Types** (if needed)
   - Add interfaces in `lib/types.ts`
   - Update ROLE_PERMISSIONS if auth needed

3. **Create Component** (`components/`)
   - Build UI component
   - Add state management
   - Connect to API

4. **Create Page** (`app/`)
   - Import components
   - Call API functions
   - Handle loading/errors
   - Update navigation if needed

5. **Test**
   - Manual testing in browser
   - Verify database changes
   - Check permissions
   - Test error cases

## Performance Considerations

1. **Database**
   - Indexes on foreign keys
   - Pagination ready (add offset/limit)
   - RLS policies for efficient filtering

2. **Frontend**
   - Component memoization possible
   - Image optimization ready
   - Code splitting automatic with Next.js

3. **Caching**
   - Supabase caches queries
   - Browser cache headers set
   - Consider adding SWR for data fetching

## Security Checklist

- ✅ Environment variables not committed
- ✅ RLS policies enforce access
- ✅ Type-safe parameter passing
- ✅ Input validation on forms
- ✅ Error messages don't expose internals
- ✅ Authentication required for protected routes
- ✅ CORS configured in Supabase
- ✅ Audit trail via activity logging

## Testing Recommendations

1. **Unit Tests**
   - Test API functions
   - Test permission checks
   - Test components

2. **Integration Tests**
   - Test auth flows
   - Test case operations
   - Test comments

3. **E2E Tests**
   - Test complete workflows
   - Test role permissions
   - Test edge cases

## File Size Summary

- Total Components: ~500 lines
- Total Pages: ~1500 lines
- Total API: ~400 lines
- Total Types: ~150 lines
- Total Styles: ~200 lines
- **Total Source**: ~2750 lines

## Deployment Checklist

- [ ] Verify all env vars configured
- [ ] Run build successfully
- [ ] Test all pages
- [ ] Test authentication
- [ ] Create test cases
- [ ] Verify permissions working
- [ ] Test in incognito mode
- [ ] Check mobile responsiveness
- [ ] Deploy to hosting
- [ ] Test production database
- [ ] Monitor error logs
