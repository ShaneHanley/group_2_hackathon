#!/bin/bash
# Quick Database Viewer Script for Bash
# Run this script to quickly view your database data

echo "=== CSIS IAM Database Viewer ==="
echo ""

echo "1. Viewing Users..."
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT id, email, \"displayName\", department, status, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC;"

echo ""
echo "2. Viewing Roles..."
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT id, name, \"departmentScope\", permissions FROM roles;"

echo ""
echo "3. Viewing User-Role Assignments..."
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT u.email, r.name as role_name, ur.\"grantedAt\" FROM user_roles ur JOIN users u ON ur.\"userId\" = u.id JOIN roles r ON ur.\"roleId\" = r.id;"

echo ""
echo "4. Viewing Recent Audit Logs..."
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT action, \"resourceType\", \"createdAt\" FROM audit_logs ORDER BY \"createdAt\" DESC LIMIT 10;"

echo ""
echo "5. Database Statistics..."
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'roles', COUNT(*) FROM roles UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;"

echo ""
echo "=== Done ==="
echo ""
echo "To connect interactively, run:"
echo "  docker exec -it iam-postgres-api psql -U iam -d iam"

