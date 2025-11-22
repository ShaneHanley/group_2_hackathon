# Fix: Admin Role Not Working After Login

## Problem
After assigning admin role and logging back in, you still get "Admin Access Required" error.

## Root Cause
The JWT strategy wasn't including `csis_roles` from the JWT payload in the user object that gets attached to requests. The roles guard needs `request.user.csis_roles` to check permissions.

## Solution Applied
✅ Fixed `backend/src/auth/strategies/jwt.strategy.ts` to include `csis_roles` from JWT payload

## Steps to Fix (Do This Now)

### 1. Restart Backend
The backend needs to be restarted for the fix to take effect:

**If backend is running:**
- Stop it (Ctrl+C in the terminal)
- Restart: `cd backend && npm run start:dev`

**Or if using PowerShell:**
```powershell
cd backend
npm run start:dev
```

### 2. Clear Browser Storage
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear Local Storage
4. Or just log out and log back in

### 3. Log Out and Log Back In
1. Click "Logout" in Admin UI
2. Log back in with `admin@csis.edu` / `Admin123!`
3. This will issue a new JWT token with roles included

### 4. Verify It Works
After logging back in:
- Check browser console (F12) - should see successful API calls
- Dashboard should show user count
- Users page should show the list
- "Create User" button should be visible

## Verify Your Token Has Roles

You can check if your token has roles by calling:

```bash
curl -X GET http://localhost:3000/api/v1/auth/userinfo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The response should include a `roles` array with `["admin"]` in it.

## If Still Not Working

1. **Check backend logs** - Look for any errors
2. **Verify role is assigned:**
   ```sql
   SELECT u.email, r.name as role 
   FROM users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   JOIN roles r ON ur.role_id = r.id 
   WHERE u.email = 'admin@csis.edu';
   ```

3. **Check JWT payload** - Decode your token at https://jwt.io and verify it has `csis_roles: ["admin"]`

4. **Restart everything:**
   ```bash
   # Stop backend
   # Restart Docker
   docker compose restart
   # Restart backend
   cd backend && npm run start:dev
   ```

## What Was Fixed

**File:** `backend/src/auth/strategies/jwt.strategy.ts`

**Before:**
```typescript
async validate(payload: any) {
  const user = await this.authService.validateUser(payload.sub);
  return user; // Missing csis_roles!
}
```

**After:**
```typescript
async validate(payload: any) {
  const user = await this.authService.validateUser(payload.sub);
  return {
    ...user,
    csis_roles: payload.csis_roles || [], // Now includes roles!
  };
}
```

This ensures the roles from the JWT token are available to the roles guard.

