# Quick Reference Guide

## Project Information

**Project**: Case Management System with Supabase  
**Location**: `c:\Users\rvito\Documents\ncr`  
**Tech Stack**: Next.js 16 + TypeScript + Tailwind CSS + Supabase  
**Status**: ✅ Ready for development and deployment

## Quick Commands

```bash
# Development
cd "c:\Users\rvito\Documents\ncr"
npm run dev                    # Start dev server (http://localhost:3000)

# Production
npm run build                  # Build optimized version
npm start                      # Run production server

# Linting
npm run lint                   # Check code quality

# Cleanup
rm -rf .next node_modules      # Clear cache and dependencies
npm install                    # Reinstall dependencies
```

## File Paths Reference

### Configuration Files
- Environment: `.env.local`
- Database Schema: `schema.sql`
- Next.js Config: `next.config.ts`
- TypeScript Config: `tsconfig.json`
- Tailwind Config: `tailwind.config.ts`

### Documentation
- README: `README.md` - Project overview
- Setup: `SETUP_GUIDE.md` - Step-by-step setup
- Implementation: `IMPLEMENTATION_SUMMARY.md` - Feature list
- Architecture: `ARCHITECTURE.md` - Technical details

### Source Code
- Pages: `src/app/`
- Components: `src/components/`
- Business Logic: `src/lib/`
- Styles: `src/app/globals.css`

## Environment Setup

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### How to Get Credentials
1. Go to https://supabase.com
2. Create/Open project
3. Go to Settings > API
4. Copy Project URL and Public Key
5. Paste into `.env.local`

## Database Setup

### Quick Start
1. Copy `schema.sql` contents
2. Go to Supabase SQL Editor
3. Paste and run
4. Done! Tables created automatically

### What Gets Created
- users (user accounts)
- case_statuses (5 default statuses)
- cases (case records)
- case_comments (discussions)
- case_activity (audit logs)
- Row-level security policies
- Performance indexes

## User Roles

| Role | Cases | Edit | Delete | Users |
|------|-------|------|--------|-------|
| Admin | All | All | ✅ | ✅ |
| Manager | Team | Team | ❌ | ❌ |
| Analyst | Assigned | Own | ❌ | ❌ |
| Viewer | Assigned | ❌ | ❌ | ❌ |

Default role for new users: **Viewer**

## API Reference

### Auth Functions
```typescript
import { signIn, signUp, signOut, getCurrentUser } from '@/lib/api'

// Login
await signIn(email, password)

// Signup
await signUp(email, password, displayName)

// Logout
await signOut()

// Get current user
const user = await getCurrentUser()
```

### Case Functions
```typescript
import { getCases, getCase, createCase, updateCase, deleteCase } from '@/lib/api'

// Get all cases
const cases = await getCases()

// Get single case
const caseData = await getCase(caseId)

// Create case
const { data, error } = await createCase(
  title, description, priority, statusId, userId, assignedTo
)

// Update case
await updateCase(caseId, { status_id, assigned_to }, userId)

// Delete case
await deleteCase(caseId, userId)
```

### Comment Functions
```typescript
import { getCaseComments, addComment } from '@/lib/api'

// Get comments
const comments = await getCaseComments(caseId)

// Add comment
const { data } = await addComment(caseId, userId, content)
```

## Page Routes

```
/                           Landing page
/auth/login                 Login page
/auth/signup                Sign up page
/dashboard                  Dashboard
/cases                      Cases list
/cases/new                  Create case
/cases/[id]                 Case details
```

## Component Usage

### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg
```

### Form Inputs
```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errorMessage}
/>

<Select
  label="Status"
  value={statusId}
  onChange={(e) => setStatusId(e.target.value)}
  options={[
    { value: '1', label: 'Open' },
    { value: '2', label: 'Closed' }
  ]}
/>

<Textarea
  label="Description"
  value={text}
  onChange={(e) => setText(e.target.value)}
/>
```

### Navigation
```tsx
<Navigation />  // Automatically shows login/user menu
```

## State Management

### Auth Store
```typescript
import { useAuthStore } from '@/lib/store'

const { user, isLoading, error, setUser, setLoading, setError } = useAuthStore()
```

### Cases Store
```typescript
import { useCaseStore } from '@/lib/store'

const { cases, isLoading, error, setCases, addCase, updateCase, deleteCase } = useCaseStore()
```

### Auth Context
```typescript
import { useAuth } from '@/lib/auth-context'

const { user, isLoading, isAuthenticated, signOut } = useAuth()
```

## Common Tasks

### Add New Case Status
1. Insert into `case_statuses` table
2. Use in case forms
3. It appears in filters automatically

### Add New User Role
1. Update `UserRole` type in `lib/types.ts`
2. Add role to `ROLE_PERMISSIONS` in `lib/types.ts`
3. Update SQL constraints in `schema.sql`
4. Update form selects in components

### Change Default Case Status
In `lib/api.ts` `getDefaultStatus()`:
```typescript
// Change 'order' number to change which status is default
```

### Add Case Field
1. Add column to `cases` table in `schema.sql`
2. Update `Case` interface in `lib/types.ts`
3. Update forms and display components
4. Update activity logging if needed

### Add Page
1. Create folder: `src/app/[route]/`
2. Create file: `page.tsx`
3. Add to Navigation if needed
4. Update types if new data structure

## Debugging Tips

### Check Auth Issues
1. Open browser DevTools
2. Go to Application tab
3. Check localStorage for auth token
4. Check Supabase dashboard Users

### Debug Database Issues
1. Go to Supabase SQL Editor
2. Check table contents
3. Review RLS policies
4. Check query logs

### Debug Component Issues
1. Open browser Console
2. Check Network tab for API calls
3. Use React DevTools extension
4. Add console.log statements

### Build Errors
1. Clear cache: `rm -rf .next`
2. Reinstall: `npm install`
3. Check TypeScript: `npx tsc --noEmit`

## Deployment Quick Checklist

- [ ] Update `.env` with production values
- [ ] Run `npm run build`
- [ ] Test production build locally: `npm start`
- [ ] Push to git repository
- [ ] Connect to Vercel/hosting
- [ ] Verify environment variables set
- [ ] Check database is accessible
- [ ] Test auth flow
- [ ] Monitor logs for errors

## Important Notes

### Security
- Never commit `.env.local` to git
- Keep Supabase keys secret
- RLS protects data at database level
- Always validate on backend

### Performance
- Database queries are optimized with indexes
- RLS policies are efficient
- Components can be memoized if needed
- Images should be optimized

### Development
- Hot reload works with `npm run dev`
- TypeScript catches errors at compile time
- Tailwind CSS builds only used styles
- ESLint enforces code quality

## Helpful Resources

### Supabase Setup
- Project URL: Settings > API
- Keys: Settings > API > Project API Keys
- Docs: https://supabase.com/docs
- SQL Editor: In dashboard

### Next.js
- Dev Server: `npm run dev`
- Build: `npm run build`
- Docs: https://nextjs.org/docs
- Environment: `.env.local`

### Tailwind CSS
- Config: `tailwind.config.ts`
- Utility Classes: https://tailwindcss.com
- Docs: https://tailwindcss.com/docs

### TypeScript
- Config: `tsconfig.json`
- Types in: `src/lib/types.ts`
- Docs: https://www.typescriptlang.org/docs

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Can't find module" | Run `npm install` |
| "Supabase env vars missing" | Update `.env.local` |
| "Port 3000 in use" | `npx kill-port 3000` |
| "Build fails" | `rm -rf .next && npm run build` |
| "Changes not showing" | Hard refresh browser `Ctrl+Shift+R` |
| "Auth token expired" | Sign out and sign back in |
| "Permission denied" | Check RLS policies and role |
| "Database down" | Check Supabase status |

## Next Steps

1. **Configure Supabase** (5 min)
   - Create account
   - Create project
   - Get credentials

2. **Initialize Database** (2 min)
   - Run schema.sql
   - Verify tables created

3. **Test Application** (5 min)
   - Run `npm run dev`
   - Create account
   - Create test case

4. **Customize** (varies)
   - Update colors in tailwind.config.ts
   - Update app name in .env.local
   - Add your branding

5. **Deploy** (10 min)
   - Push to GitHub
   - Connect to Vercel
   - Set environment variables

---

**Questions?** Check:
- README.md - Overview
- SETUP_GUIDE.md - Step-by-step
- IMPLEMENTATION_SUMMARY.md - Features
- ARCHITECTURE.md - Technical details

Good luck! 🚀
