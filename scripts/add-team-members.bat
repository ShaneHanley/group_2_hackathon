@echo off
REM Batch script to add all 6 team members to IAM database
REM Password: Admin_123!
REM Role: admin

echo ========================================
echo Adding Team Members to IAM Database
echo ========================================
echo.

echo Ensuring pgcrypto extension is available...
docker exec iam-postgres-api psql -U iam -d iam -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >nul 2>&1

echo.
echo Creating users and assigning admin role...
echo.

REM Create user: darren@csis.edu
echo Creating darren@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'darren@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Darren', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'darren@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

REM Create user: luke@csis.edu
echo Creating luke@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'luke@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Luke', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'luke@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

REM Create user: muadh@csis.edu
echo Creating muadh@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'muadh@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Muadh', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'muadh@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

REM Create user: nik@csis.edu
echo Creating nik@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'nik@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Nik', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'nik@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

REM Create user: shane@csis.edu
echo Creating shane@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'shane@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Shane', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'shane@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

REM Create user: sophaila@csis.edu
echo Creating sophaila@csis.edu...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) SELECT gen_random_uuid(), 'sophaila@csis.edu', crypt('Admin_123!', gen_salt('bf')), 'Sophaila', 'CS', 'active', NOW(), NOW() ON CONFLICT (email) DO UPDATE SET password_hash = crypt('Admin_123!', gen_salt('bf')), status = 'active';" >nul 2>&1
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, (SELECT id FROM users WHERE email = 'admin@csis.edu'), NOW() FROM users u, roles r WHERE u.email = 'sophaila@csis.edu' AND r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = r.id);" >nul 2>&1
echo   Created and assigned admin role
echo.

echo ========================================
echo All team members added successfully!
echo ========================================
echo.
echo Summary:
echo - Password for all: Admin_123!
echo - Role: admin
echo - Status: active
echo.
echo Team members:
echo   1. darren@csis.edu
echo   2. luke@csis.edu
echo   3. muadh@csis.edu
echo   4. nik@csis.edu
echo   5. shane@csis.edu
echo   6. sophaila@csis.edu
echo.
echo They can now login at: http://localhost:5173
echo.
pause

