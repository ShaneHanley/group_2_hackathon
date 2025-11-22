# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Make sure you have the admin role assigned" Error

**Symptoms:**
- Admin UI shows error message
- Can't see users list
- Can't see "Create User" button

**Cause:**
Your JWT token was issued before the admin role was assigned, so it doesn't include the role in the token.

**Solution:**
1. **Log out** from the Admin UI
2. **Log back in** with your admin credentials (`admin@csis.edu` / `Admin123!`)
3. This will issue a new JWT token that includes the admin role
4. You should now see the users list and all admin features

**Verify your role is assigned:**
```sql
-- Check if you have admin role
SELECT u.email, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'admin@csis.edu';
```

If no role is returned, assign it:
```sql
-- Assign admin role
INSERT INTO user_roles (id, user_id, role_id, granted_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u, roles r
WHERE u.email = 'admin@csis.edu' AND r.name = 'admin';
```

### Issue: Backend Won't Start

**Check:**
1. Is PostgreSQL running? `docker compose ps`
2. Are ports 3000 and 8080 available?
3. Is `.env` file configured correctly?

**Solution:**
```bash
# Check Docker containers
docker compose ps

# View logs
docker compose logs backend

# Restart services
docker compose restart
```

### Issue: Frontend Can't Connect to Backend

**Check:**
1. Is backend running on port 3000?
2. Check browser console for CORS errors
3. Verify proxy configuration in `vite.config.ts`

**Solution:**
- Make sure backend is running: `cd backend && npm run start:dev`
- Check backend logs for errors
- Verify CORS settings in `backend/src/main.ts`

### Issue: Can't Login

**Check:**
1. Is user account active? (not pending)
2. Is password correct?
3. Check backend logs for errors

**Solution:**
```sql
-- Activate user
UPDATE users SET status = 'active' WHERE email = 'your-email@csis.edu';
```

### Issue: Token Expired

**Symptoms:**
- 401 Unauthorized errors
- Redirected to login page

**Solution:**
- Log out and log back in
- Or use the refresh token endpoint to get a new access token

### Issue: Database Connection Errors

**Check:**
1. Is PostgreSQL container running?
2. Are database credentials correct in `.env`?
3. Is the database created?

**Solution:**
```bash
# Check PostgreSQL
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT 1;"

# Check connection from backend
# Verify DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env
```

## Quick Fixes

### Refresh Your Admin Token
1. Log out from Admin UI
2. Log back in
3. This gets a fresh token with your current roles

### Reset Everything
```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
```

### Check Service Status
```bash
# All services
docker compose ps

# Backend logs
docker compose logs backend

# Frontend (if running)
# Check terminal where you ran npm run dev
```

## Getting Help

1. Check browser console (F12) for frontend errors
2. Check backend terminal for server errors
3. Check Docker logs: `docker compose logs`
4. Verify database: `docker exec -it iam-postgres-api psql -U iam -d iam`

