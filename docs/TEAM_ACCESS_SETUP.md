# Team Member Access Setup Guide

This guide explains how to give your 5 team members access to the CSIS IAM system.

## Overview

Each team member needs access to:
1. **Admin UI** - To manage users and roles
3. **REST API** - For programmatic access and integration
4. **Swagger Documentation** - Interactive API testing
5. **Database** - For development/debugging (optional)
6. **OAuth2/OIDC Endpoints** - For system integration
7. **Project Repository** - Code access

**📖 See `docs/ACCESS_ALL_SERVICES.md` for complete access guide to all services.**

---

## How Team Members Access the Admin UI

### Option 1: Each Team Member Runs Locally (Recommended for Development)

**Best for:** Individual development work

Each team member runs the frontend on their own machine:

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd Hackathon
   ```

2. **Start Docker services:**
   ```bash
   docker compose up -d
   ```

3. **Start backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

4. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access locally:**
   - Admin UI: http://localhost:5173
   - API: http://localhost:3000

### Option 2: Access via Network (One Person Hosts)

**Best for:** Quick testing, demos, or if team members don't have the project set up

**On the host machine (person running the servers):**

1. **Find your IP address:**
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Update Vite config** (already done - `host: '0.0.0.0'`)

3. **Update backend CORS** to allow your network:
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: [
       'http://localhost:5173',
       'http://192.168.1.100:5173', // Host machine IP
       // Add other team member IPs if needed
     ],
     credentials: true,
   });
   ```

4. **Start services:**
   ```bash
   # Backend
   cd backend
   npm run start:dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

**Team members access via:**
- Admin UI: `http://[HOST_IP]:5173` (e.g., `http://192.168.1.100:5173`)
- API: `http://[HOST_IP]:3000` (e.g., `http://192.168.1.100:3000`)

**Note:** All team members must be on the same network (same WiFi/LAN).

### Option 3: Deploy to a Shared Server

**Best for:** Production or persistent access

Deploy to a shared server, cloud instance, or use a service like:
- Heroku
- Railway
- Render
- Your university's server

---

## Step 1: Create Users in IAM Database

### Quick Setup: Use the Batch Script

**Run the provided script:**
```cmd
scripts\add-team-members.bat
```

This will:
- Create all 6 team members (darren, luke, muadh, nik, shane, sophaila)
- Set password to `group2` for all
- Assign admin role to all
- Set status to active

### Manual Setup: Via Admin UI

1. **Login to Admin UI:**
   - URL: http://localhost:5173 (or network IP)
   - Login with admin account

2. **Create User:**
   - Go to "Users" page
   - Click "Create User"
   - Fill in:
     - Email: `[teammate-name]@csis.edu`
     - Display Name: `John Doe`
     - Password: `[secure-password]`
     - Department: `CS`
   - Click "Create"

3. **Assign Admin Role:**
   - Find the user in the list
   - Click "Assign Role"
   - Select "admin" role
   - Click "Assign"

---

## Step 2: Share Project Access

### Git Repository Access

1. **Add team members to repository:**
   - GitHub/GitLab: Settings → Collaborators → Add people
   - Give them "Write" or "Admin" access

2. **Share repository URL:**
   ```
   git clone [repository-url]
   ```

### Environment Configuration

Create a shared `.env.example` file with all required variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=iam
DB_PASSWORD=iam
DB_DATABASE=iam

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m

# Application
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Share the actual `.env` values securely** (use a password manager or encrypted channel).

---

## Step 3: Setup Instructions for Team Members

### Prerequisites
- Docker Desktop installed
- Node.js 18+ and npm
- Git

### Setup Steps

1. **Clone Repository:**
   ```bash
   git clone [repository-url]
   cd Hackathon
   ```

2. **Start Docker Services:**
   ```bash
   docker compose up -d
   ```

3. **Configure Environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with shared credentials
   ```

4. **Install Dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Start Services:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run start:dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

6. **Access Services:**
   - Admin UI: http://localhost:5173
   - API: http://localhost:3000
   - Swagger: http://localhost:3000/api
   - Keycloak: http://localhost:8080/admin

7. **Login:**
   - Use the credentials you were given
   - Email: `[your-email]@csis.edu`
   - Password: `group2` (or shared password)

---

## Step 5: Network Access Setup (If Using Option 2)

### On Host Machine

1. **Find your IP:**
   ```cmd
   ipconfig
   ```
   Note your IPv4 address (e.g., `192.168.1.100`)

2. **Share with team:**
   - Admin UI: `http://192.168.1.100:5173`
   - API: `http://192.168.1.100:3000`

3. **Update backend CORS** (if needed):
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: [
       'http://localhost:5173',
       'http://192.168.1.100:5173',
       // Add team member IPs
     ],
     credentials: true,
   });
   ```

### On Team Member Machines

1. **Access Admin UI:**
   - Open browser
   - Go to: `http://[HOST_IP]:5173`
   - Login with credentials

2. **If CORS errors occur:**
   - Ask host to add your IP to CORS whitelist
   - Or use a browser extension to disable CORS (development only)

---

## Step 6: Role Assignments

### Recommended Roles for Team Members

| Team Member | Keycloak Role | IAM Role | Access Level |
|------------|---------------|----------|--------------|
| Team Lead | admin | admin | Full access |
| Backend Dev 1 | admin | admin | Full access |
| Backend Dev 2 | admin | admin | Full access |
| Frontend Dev | admin | admin | Full access |
| DevOps/QA | admin | admin | Full access |
| Integration/SDK | developer | developer | API access only |

### Assign Roles

**In IAM Database (via Admin UI):**
1. Admin UI → Users → Select user
2. Click "Assign Role" → Select role
3. Click "Assign"

---

## Step 7: Database Access (Optional)

If team members need direct database access:

### Share Database Credentials

**IAM Database:**
- Host: `localhost` (or host IP if remote)
- Port: `5433`
- Database: `iam`
- Username: `iam`
- Password: `iam`

### Access Methods

**Via Docker:**
```bash
# IAM Database
docker exec -it iam-postgres-api psql -U iam -d iam
```

**Via Database Tool:**
- Use pgAdmin, DBeaver, or VS Code PostgreSQL extension
- Connect using credentials above

---

## Security Best Practices

1. **Use Strong Passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Share via secure channel (password manager)

2. **Rotate Credentials:**
   - Change default admin password
   - Use different passwords for each team member
   - Rotate after hackathon if needed

3. **Limit Access:**
   - Only give admin access to those who need it
   - Use developer role for API-only access
   - Revoke access after hackathon

4. **Audit Access:**
   - Check audit logs regularly
   - Monitor who's accessing what

---

## Troubleshooting

### Team Member Can't Access Admin UI

**If using localhost:**
- Make sure they're running the frontend on their machine
- Check that port 5173 is not in use
- Verify Docker services are running

**If using network access:**
- Check firewall settings on host machine
- Verify both machines are on same network
- Check that Vite is binding to `0.0.0.0` (already configured)
- Verify backend CORS allows the team member's IP

### Team Member Can't Login

1. **Check User Status:**
   ```sql
   SELECT email, status FROM users WHERE email = 'teammate@csis.edu';
   ```
   - Should be `active`

2. **Check Role Assignment:**
   ```sql
   SELECT u.email, r.name 
   FROM users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   JOIN roles r ON ur.role_id = r.id 
   WHERE u.email = 'teammate@csis.edu';
   ```

3. **Reset Password:**
   - Admin UI → Users → Select user → Reset Password
   - Or use password reset flow

### CORS Errors

If team members see CORS errors when accessing via network:

1. **Update backend CORS:**
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: true, // Allow all origins (development only!)
     credentials: true,
   });
   ```

2. **Or add specific IPs:**
   ```typescript
   app.enableCors({
     origin: [
       'http://localhost:5173',
       'http://192.168.1.100:5173',
       'http://192.168.1.101:5173',
       // Add all team member IPs
     ],
     credentials: true,
   });
   ```

---

## Quick Reference

### Admin Accounts

**IAM Admin UI:**
- Local: http://localhost:5173
- Network: http://[HOST_IP]:5173
- Login with team member credentials
- Must have `admin` role assigned

### API Access

**Get Admin Token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teammate@csis.edu",
    "password": "group2"
  }'
```

**Use Token:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary Checklist

For each team member:
- [ ] Create user in IAM database (use `scripts\add-team-members.bat`)
- [ ] Assign admin role in IAM database
- [ ] Share repository access
- [ ] Share environment variables
- [ ] Share access method (localhost or network IP)
- [ ] Verify login works
- [ ] Verify admin access works
