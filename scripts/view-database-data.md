# How to Access Database Data

## Method 1: Using Docker Exec (Command Line)

### Access IAM API Database (Your Custom Data)

```powershell
# Connect to IAM database
docker exec -it iam-postgres-api psql -U iam -d iam

# Once connected, you can run SQL queries:
# List all tables
\dt

# View all users
SELECT id, email, "displayName", department, status, "createdAt" FROM users;

# View all roles
SELECT id, name, "departmentScope", permissions FROM roles;

# View user roles assignments
SELECT u.email, r.name as role_name, ur."grantedAt"
FROM user_roles ur
JOIN users u ON ur."userId" = u.id
JOIN roles r ON ur."roleId" = r.id;

# View audit logs
SELECT "action", "resourceType", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 10;

# Exit psql
\q
```

### Access Keycloak Database

```powershell
# Connect to Keycloak database
docker exec -it iam-postgres-keycloak psql -U keycloak -d keycloak

# List tables (Keycloak has many tables)
\dt

# View realms
SELECT id, name, enabled FROM realm;

# View users in Keycloak
SELECT id, username, email, enabled, email_verified FROM user_entity;

# View roles
SELECT id, name, realm_id FROM keycloak_role;

# Exit
\q
```

## Method 2: Quick SQL Queries (One-liners)

### View Users in IAM Database
```powershell
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT id, email, \"displayName\", status FROM users;"
```

### View Roles in IAM Database
```powershell
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT id, name, \"departmentScope\" FROM roles;"
```

### View User-Role Assignments
```powershell
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT u.email, r.name FROM user_roles ur JOIN users u ON ur.\"userId\" = u.id JOIN roles r ON ur.\"roleId\" = r.id;"
```

### Count Records
```powershell
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'roles', COUNT(*) FROM roles UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;"
```

## Method 3: Using Database GUI Tools

### Option A: pgAdmin
1. Download pgAdmin from https://www.pgadmin.org/
2. Add new server:
   - Name: IAM Database
   - Host: localhost
   - Port: 5433
   - Database: iam
   - Username: iam
   - Password: iam

### Option B: DBeaver
1. Download DBeaver from https://dbeaver.io/
2. Create new connection → PostgreSQL
3. Enter connection details:
   - Host: localhost
   - Port: 5433
   - Database: iam
   - Username: iam
   - Password: iam

### Option C: VS Code Extension
1. Install "PostgreSQL" extension in VS Code
2. Add connection:
   - Host: localhost
   - Port: 5433
   - Database: iam
   - Username: iam
   - Password: iam

## Method 4: Using Adminer (Web-based)

Add to docker-compose.yml:
```yaml
  adminer:
    image: adminer
    container_name: iam-adminer
    ports:
      - "8081:8080"
    depends_on:
      - postgres-iam
      - postgres-keycloak
```

Then access: http://localhost:8081
- System: PostgreSQL
- Server: postgres-iam (or postgres-keycloak)
- Username: iam (or keycloak)
- Password: iam (or keycloak)
- Database: iam (or keycloak)

## Common Queries

### Find User by Email
```sql
SELECT * FROM users WHERE email = 'admin@csis.edu';
```

### Find User's Roles
```sql
SELECT r.name, r.permissions
FROM user_roles ur
JOIN roles r ON ur."roleId" = r.id
WHERE ur."userId" = (SELECT id FROM users WHERE email = 'admin@csis.edu');
```

### View Recent Audit Logs
```sql
SELECT 
  a.action,
  a."resourceType",
  u.email as actor_email,
  a."createdAt"
FROM audit_logs a
LEFT JOIN users u ON a."actorId" = u.id
ORDER BY a."createdAt" DESC
LIMIT 20;
```

### View Token Blacklist
```sql
SELECT token, "expiresAt", "createdAt" FROM token_blacklist ORDER BY "createdAt" DESC;
```

### View Pending Users
```sql
SELECT id, email, "displayName", status FROM users WHERE status = 'pending';
```

