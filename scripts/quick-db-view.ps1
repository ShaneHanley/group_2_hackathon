# Quick Database Viewer Script for PowerShell
# Run this script to quickly view your database data

Write-Host "=== CSIS IAM Database Viewer ===" -ForegroundColor Cyan
Write-Host ""

# Function to run SQL query
function Invoke-DBQuery {
    param(
        [string]$Query,
        [string]$Database = "iam"
    )
    
    if ($Database -eq "iam") {
        docker exec iam-postgres-api psql -U iam -d iam -c $Query
    } else {
        docker exec iam-postgres-keycloak psql -U keycloak -d keycloak -c $Query
    }
}

Write-Host "1. Viewing Users..." -ForegroundColor Yellow
Invoke-DBQuery 'SELECT id, email, display_name, department, status, created_at FROM users ORDER BY created_at DESC;'

Write-Host "`n2. Viewing Roles..." -ForegroundColor Yellow
Invoke-DBQuery 'SELECT id, name, department_scope, permissions FROM roles;'

Write-Host "`n3. Viewing User-Role Assignments..." -ForegroundColor Yellow
Invoke-DBQuery 'SELECT u.email, r.name as role_name, ur.granted_at FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id;'

Write-Host "`n4. Viewing Recent Audit Logs..." -ForegroundColor Yellow
Invoke-DBQuery 'SELECT action, resource_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;'

Write-Host "`n5. Database Statistics..." -ForegroundColor Yellow
Invoke-DBQuery "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'roles', COUNT(*) FROM roles UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;"

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "`nTo connect interactively, run:" -ForegroundColor Cyan
Write-Host "  docker exec -it iam-postgres-api psql -U iam -d iam" -ForegroundColor White

