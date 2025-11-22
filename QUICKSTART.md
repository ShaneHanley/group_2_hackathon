# Quick Start Guide

Get the CSIS IAM Service running in 15 minutes!

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ and npm
- Git

## Step 1: Start Infrastructure (5 minutes)

```bash
# Start Keycloak and PostgreSQL
docker compose up -d

# Wait for services to be ready
# Check Keycloak is running: http://localhost:8080
```

## Step 2: Configure Keycloak (5 minutes)

1. **Access Keycloak Admin Console:**
   - URL: http://localhost:8080/admin
   - Username: `admin`
   - Password: `admin`

2. **Create CSIS Realm:**
   - Click "Master" dropdown (top left)
   - Click "Create Realm"
   - Name: `CSIS`
   - Click "Create"

3. **Create Base Roles:**
   - Go to "Roles" in left menu
   - Click "Add Role"
   - Create: `admin`, `staff`, `student`, `developer`
   - Save each role

4. **Create OAuth Client:**
   - Go to "Clients" → "Create"
   - Client ID: `csis-iam-api`
   - Client Type: `OpenID Connect`
   - Click "Next"
   - Client Authentication: `On`
   - Click "Save"
   - Go to "Credentials" tab
   - **Copy the Client Secret** (you'll need this)

## Step 3: Configure Backend (2 minutes)

```bash
# Copy environment file
cd backend
cp .env.example .env

# Edit .env and update:
# - KEYCLOAK_CLIENT_SECRET (from Step 2)
# - JWT_SECRET (use a strong random string)
```

## Step 4: Install Dependencies (2 minutes)

```bash
# From project root
npm run setup

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

## Step 5: Start Services (1 minute)

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Step 6: Test It! (1 minute)

1. **Register a user:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@csis.edu",
       "password": "Admin123!",
       "displayName": "Admin User",
       "department": "CS"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@csis.edu",
       "password": "Admin123!"
     }'
   ```
   Copy the `accessToken` from the response.

3. **Access protected endpoint:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/auth/userinfo \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

4. **Access Admin UI:**
   - Visit: http://localhost:5173
   - Login with the credentials you created

## Verify Everything Works

✅ Keycloak running: http://localhost:8080  
✅ API running: http://localhost:3000  
✅ Swagger docs: http://localhost:3000/api  
✅ Admin UI: http://localhost:5173  

## Next Steps

- Assign roles to users via Admin UI
- Check audit logs
- Integrate with other CSIS systems (see `docs/INTEGRATION.md`)

## Troubleshooting

**Keycloak not starting?**
- Check Docker is running
- Check port 8080 is not in use
- Check logs: `docker compose logs keycloak`

**Backend errors?**
- Verify `.env` file exists and has correct values
- Check PostgreSQL is running: `docker compose ps`
- Check backend logs for errors

**Frontend not connecting?**
- Verify backend is running on port 3000
- Check browser console for errors
- Verify CORS settings in `backend/src/main.ts`

## Need Help?

See the full documentation in `IAM-Service-Plan.md` or `docs/INTEGRATION.md`.

