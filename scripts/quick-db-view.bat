@echo off
REM Quick Database Viewer Script for CMD.exe
REM Run this script to quickly view your database data

echo === CSIS IAM Database Viewer ===
echo.

echo 1. Viewing Users...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT id, email, display_name, department, status, created_at FROM users ORDER BY created_at DESC;"

echo.
echo 2. Viewing Roles...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT id, name, department_scope, permissions FROM roles;"

echo.
echo 3. Viewing User-Role Assignments...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT u.email, r.name as role_name, ur.granted_at FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id;"

echo.
echo 4. Viewing Recent Audit Logs...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT action, resource_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;"

echo.
echo 5. Database Statistics...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'roles', COUNT(*) FROM roles UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;"

echo.
echo === Done ===
echo.
echo To connect interactively, run:
echo   docker exec -it iam-postgres-api psql -U iam -d iam
echo.
pause

