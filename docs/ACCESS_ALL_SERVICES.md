# Complete Access Guide for Team Members

This guide shows how team members can access all parts of the CSIS IAM system.

## 🎯 Quick Access Summary

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **Admin UI** | http://localhost:5173 | Email + `Admin_123!` | Manage users, roles, audit logs |
| **API** | http://localhost:3000 | Bearer token | REST API endpoints |
| **Swagger Docs** | http://localhost:3000/api | Bearer token | API documentation |
| **IAM Database** | localhost:5432 | `iam` / `iam` | Direct database access |

---

## 1. Admin UI (Frontend Dashboard)

### Access
- **Local:** http://localhost:5173
- **Network:** http://[HOST_IP]:5173 (if someone is hosting)

### Login Credentials
- **Email:** `[your-email]@csis.edu`
  - darren@csis.edu
  - luke@csis.edu
  - muadh@csis.edu
  - nik@csis.edu
  - shane@csis.edu
  - sophaila@csis.edu
- **Password:** `Admin_123!`

### What You Can Do
- View and manage users
- Create, edit, delete roles
- Assign/remove roles from users
- View audit logs
- Activate/deactivate users

### Setup (If Running Locally)
```bash
cd frontend
npm install
npm run dev
```

---

## 2. REST API

### Access
- **Base URL:** http://localhost:3000/api/v1
- **Network:** http://[HOST_IP]:3000/api/v1

### Getting an Access Token

**Login to get token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "darren@csis.edu",
    "password": "Admin_123!"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": { ... }
}
```

### Using the Token

**Example: Get all users:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example: Get all roles:**
```bash
curl -X GET http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Setup (If Running Locally)
```bash
cd backend
npm install
npm run start:dev
```

---

## 3. Swagger API Documentation

### Access
- **URL:** http://localhost:3000/api
- **Network:** http://[HOST_IP]:3000/api

### Features
- Interactive API documentation
- Test endpoints directly in browser
- See request/response schemas
- Authenticate with "Authorize" button

### How to Use
1. Open http://localhost:3000/api in browser
2. Click "Authorize" button (top right)
3. Enter: `Bearer YOUR_ACCESS_TOKEN`
4. Click "Authorize"
5. Now you can test endpoints directly

### Getting Token for Swagger
1. Use the `/auth/login` endpoint in Swagger
2. Copy the `accessToken` from response
3. Use it in the "Authorize" button

---

## 4. OAuth2/OIDC Endpoints

### Discovery Document
- **URL:** http://localhost:3000/api/v1/.well-known/openid-configuration
- **Purpose:** OIDC configuration for client apps

### JWKS (Public Keys)
- **URL:** http://localhost:3000/api/v1/.well-known/jwks.json
- **Purpose:** Public keys for token verification

### Token Endpoint
- **URL:** http://localhost:3000/api/v1/oauth/token
- **Purpose:** Get OAuth2 tokens (custom implementation)

### UserInfo Endpoint
- **URL:** http://localhost:3000/api/v1/oauth/userinfo
- **Purpose:** Get user information (requires Bearer token)

### Token Introspection
- **URL:** http://localhost:3000/api/v1/oauth/introspect
- **Purpose:** Validate tokens

---

## 5. Database Access

### IAM Database

**Connection Details:**
- Host: `localhost` (or host IP)
- Port: `5432`
- Database: `iam`
- Username: `iam`
- Password: `iam`

**Via Docker:**
```bash
docker exec -it iam-postgres-api psql -U iam -d iam
```

**Via Database Tool:**
- pgAdmin, DBeaver, VS Code PostgreSQL extension
- Use connection details above

**Quick View Script:**
```cmd
scripts\quick-db-view.bat
```

---

## 6. Common API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and revoke tokens
- `POST /api/v1/auth/password-reset` - Request password reset
- `GET /api/v1/auth/userinfo` - Get current user info

### Users (Admin Only)
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user (admin only)
- `DELETE /api/v1/users/:id` - Delete user (admin only)

### Roles
- `GET /api/v1/roles` - List all roles
- `POST /api/v1/roles` - Create role (admin only)
- `GET /api/v1/roles/:id` - Get role by ID
- `PATCH /api/v1/roles/:id` - Update role (admin only)
- `DELETE /api/v1/roles/:id` - Delete role (admin only)

### Role Assignment (Admin Only)
- `POST /api/v1/admin/users/:userId/roles/:roleId` - Assign role
- `DELETE /api/v1/admin/users/:userId/roles/:roleId` - Remove role

### Audit Logs (Admin Only)
- `GET /api/v1/admin/audit` - View audit logs
  - Query params: `userId`, `action`, `from`, `to`

---

## 8. Testing with Postman/Thunder Client

### Setup Collection

1. **Import Environment Variables:**
   ```
   BASE_URL: http://localhost:3000
   ACCESS_TOKEN: (get from login)
   ```

2. **Login Request:**
   - Method: POST
   - URL: `{{BASE_URL}}/api/v1/auth/login`
   - Body:
     ```json
     {
       "email": "darren@csis.edu",
       "password": "Admin_123!"
     }
     ```
   - Save `accessToken` to environment variable

3. **Authenticated Requests:**
   - Add header: `Authorization: Bearer {{ACCESS_TOKEN}}`

---

## 9. Network Access Setup

### If One Person is Hosting

**On Host Machine:**

1. **Find IP Address:**
   ```cmd
   ipconfig
   ```
   Note IPv4 address (e.g., `192.168.1.100`)

2. **Share URLs with Team:**
   - Admin UI: `http://192.168.1.100:5173`
   - API: `http://192.168.1.100:3000`
   - Swagger: `http://192.168.1.100:3000/api`

3. **Ensure Services Are Running:**
   ```bash
   # Backend
   cd backend
   npm run start:dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

**On Team Member Machines:**

- Just open the URLs in browser
- Use same login credentials
- Must be on same network (same WiFi/LAN)

---

## 10. Quick Start Checklist for Team Members

### First Time Setup

- [ ] Clone repository
- [ ] Install Docker Desktop
- [ ] Start Docker services: `docker compose up -d`
- [ ] Install Node.js dependencies:
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```
- [ ] Copy `.env` file from team lead
- [ ] Start backend: `cd backend && npm run start:dev`
- [ ] Start frontend: `cd frontend && npm run dev`

### Daily Access

- [ ] Start Docker: `docker compose up -d`
- [ ] Start backend (if needed)
- [ ] Start frontend (if needed)
- [ ] Access Admin UI: http://localhost:5173
- [ ] Login with your credentials

---

## 11. Troubleshooting Access Issues

### Can't Access Admin UI

**If using localhost:**
- Check frontend is running: `npm run dev` in frontend folder
- Check port 5173 is not in use
- Try http://127.0.0.1:5173

**If using network:**
- Verify both machines on same network
- Check firewall allows port 5173
- Verify host machine IP is correct
- Check Vite config has `host: '0.0.0.0'`

### Can't Access API

**Check backend is running:**
```bash
cd backend
npm run start:dev
```

**Check CORS:**
- Backend should allow all origins in development
- Check `backend/src/main.ts` CORS configuration

### Database Connection Issues

**Check database is running:**
```bash
docker ps | findstr postgres
```

**Test connection:**
```bash
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT 1;"
```

---

## 12. Useful Commands

### Start Everything
```bash
# Terminal 1: Docker services
docker compose up -d

# Terminal 2: Backend
cd backend
npm run start:dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Stop Everything
```bash
# Stop frontend: Ctrl+C
# Stop backend: Ctrl+C
# Stop Docker: docker compose down
```

### View Logs
```bash
# Docker logs
docker compose logs -f

# Backend logs (in terminal running npm run start:dev)
# Frontend logs (in terminal running npm run dev)
```

### Reset Everything
```bash
# Stop and remove containers and volumes
docker compose down -v

# Restart fresh
docker compose up -d
```

---

## Summary

**All team members have access to:**

✅ **Admin UI** - http://localhost:5173 (Email + `Admin_123!`)  
✅ **REST API** - http://localhost:3000/api/v1 (Bearer token)  
✅ **Swagger Docs** - http://localhost:3000/api (Interactive testing)  
✅ **Databases** - Via Docker exec or database tools  
✅ **OAuth2/OIDC** - Standard endpoints for integration  

**For network access, replace `localhost` with the host machine's IP address.**

