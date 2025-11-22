@echo off
REM Simple batch script to assign admin role to all users
echo ========================================
echo Assigning Admin Role to All Users
echo ========================================
echo.

echo Step 1: Creating admin role if it doesn't exist...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at) SELECT gen_random_uuid(), 'admin', NULL, '[\"manage_users\", \"manage_roles\", \"view_audit\", \"manage_system\"]'::jsonb, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');"

echo.
echo Step 2: Assigning admin role to all active users...
docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), u.id, r.id, u.id, NOW() FROM users u CROSS JOIN roles r WHERE r.name = 'admin' AND u.status = 'active' AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);"

echo.
echo Step 3: Verifying assignments...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT u.email, u.display_name, STRING_AGG(r.name, ', ') as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.status = 'active' GROUP BY u.id, u.email, u.display_name ORDER BY u.email;"

echo.
echo ========================================
echo Done! All active users now have admin role.
echo Refresh your browser to get admin access.
echo ========================================
pause

