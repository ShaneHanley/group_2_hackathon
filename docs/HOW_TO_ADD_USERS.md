# How to Add Users to CSIS IAM

## Method 1: Admin UI (Easiest) ✅

1. **Login to Admin UI:**
   - Go to http://localhost:5173
   - Login with admin credentials

2. **Navigate to Users Page:**
   - Click "Users" in the navigation menu

3. **Click "Create User" Button:**
   - Top right corner of the Users page
   - Fill in the form:
     - Email (required)
     - Password (required, min 8 characters)
     - Display Name (required)
     - Department (optional)
   - Click "Create User"

4. **Activate the User:**
   - New users are created with "pending" status
   - Click "Activate" button next to the user
   - User can now login

## Method 2: API Endpoint (Using curl/Postman)

### Option A: Public Registration Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@csis.edu\",\"password\":\"Password123!\",\"displayName\":\"New User\",\"department\":\"CS\"}"
```

### Option B: Admin Create User Endpoint (Requires Auth)
```bash
# First, login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@csis.edu\",\"password\":\"Admin123!\"}" | jq -r '.accessToken')

# Then create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@csis.edu\",\"password\":\"Password123!\",\"displayName\":\"New User\",\"department\":\"CS\"}"
```

## Method 3: Swagger UI (Interactive)

1. **Go to Swagger UI:**
   - http://localhost:3000/api

2. **Authorize:**
   - Click "Authorize" button (top right)
   - Enter your Bearer token
   - Click "Authorize"

3. **Create User:**
   - Find `POST /api/v1/users` endpoint
   - Click "Try it out"
   - Fill in the request body
   - Click "Execute"

## Method 4: Direct Database (Not Recommended)

Only use this for testing or if other methods fail:

```sql
-- Insert user directly (password will need to be hashed)
INSERT INTO users (id, email, password_hash, display_name, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'user@csis.edu',
  '$2b$10$...', -- Use bcrypt to hash password first
  'User Name',
  'active',
  NOW(),
  NOW()
);
```

## After Creating a User

1. **Activate the User:**
   - Users are created with "pending" status
   - Admin must activate them before they can login
   - In Admin UI: Click "Activate" button
   - Via API: `PATCH /api/v1/users/{id}` with `{"status": "active"}`

2. **Assign Roles:**
   - In Admin UI: Click "Manage Roles" and select roles
   - Via API: `POST /api/v1/admin/users/{userId}/roles/{roleId}`

3. **User Can Now Login:**
   - User can login with their email and password
   - They'll have the roles you assigned

## Quick Test Script

**PowerShell:**
```powershell
# Register a new user
$body = @{
    email = "testuser@csis.edu"
    password = "Test123!"
    displayName = "Test User"
    department = "CS"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**Bash/Command Prompt:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@csis.edu\",\"password\":\"Test123!\",\"displayName\":\"Test User\",\"department\":\"CS\"}"
```

## Tips

- **Password Requirements:** Minimum 8 characters (enforced by validation)
- **Email Must Be Unique:** Each email can only be used once
- **User Status:** New users start as "pending" - must be activated
- **Roles:** Assign roles after creating user for proper access control

