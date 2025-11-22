# PowerShell script to assign admin role to all existing users
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Assigning Admin Role to Users" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerAvailable) {
    Write-Host "Error: Docker is not available. Please ensure Docker is running." -ForegroundColor Red
    exit 1
}

# Check if container is running
$containerRunning = docker ps --filter "name=iam-postgres-api" --format "{{.Names}}" | Select-String "iam-postgres-api"
if (-not $containerRunning) {
    Write-Host "Error: PostgreSQL container 'iam-postgres-api' is not running." -ForegroundColor Red
    Write-Host "Start it with: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking if 'admin' role exists..." -ForegroundColor Green
$roleCheck = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM roles WHERE name = 'admin';" 2>&1
$adminRoleId = $roleCheck.Trim()

if ([string]::IsNullOrWhiteSpace($adminRoleId)) {
    Write-Host "Admin role does not exist. Creating it..." -ForegroundColor Yellow
    docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at) VALUES (gen_random_uuid(), 'admin', NULL, '[\"manage_users\", \"manage_roles\", \"view_audit\", \"manage_system\"]'::jsonb, NOW(), NOW()) ON CONFLICT DO NOTHING;" 2>&1 | Out-Null
    $adminRoleId = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM roles WHERE name = 'admin';" 2>&1 | ForEach-Object { $_.Trim() }
    Write-Host "Admin role created" -ForegroundColor Green
} else {
    Write-Host "Admin role exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Getting list of all users..." -ForegroundColor Green
$users = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id, email FROM users WHERE status = 'active';" 2>&1

if ([string]::IsNullOrWhiteSpace($users.Trim())) {
    Write-Host "No active users found in the database." -ForegroundColor Yellow
    Write-Host "You may need to create users first or activate pending users." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Assigning admin role to all active users..." -ForegroundColor Green
Write-Host ""

$userCount = 0
$assignedCount = 0

# Process each user
$users -split "`n" | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    
    $parts = $line -split '\|'
    if ($parts.Length -ge 2) {
        $userId = $parts[0].Trim()
        $userEmail = $parts[1].Trim()
        
        if ([string]::IsNullOrWhiteSpace($userId) -or [string]::IsNullOrWhiteSpace($userEmail)) { return }
        
        $userCount++
        Write-Host "Processing: $userEmail" -ForegroundColor Cyan
        
        # Check if user already has admin role
        $existingRole = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM user_roles WHERE user_id = '$userId' AND role_id = '$adminRoleId';" 2>&1 | ForEach-Object { $_.Trim() }
        
        if ([string]::IsNullOrWhiteSpace($existingRole)) {
            # Assign admin role
            $result = docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), '$userId', '$adminRoleId', '$userId', NOW() WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '$userId' AND role_id = '$adminRoleId');" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Admin role assigned" -ForegroundColor Green
                $assignedCount++
            } else {
                Write-Host "  Failed to assign role" -ForegroundColor Red
            }
        } else {
            Write-Host "  Already has admin role" -ForegroundColor Yellow
            $assignedCount++
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total users processed: $userCount" -ForegroundColor White
Write-Host "Users with admin role: $assignedCount" -ForegroundColor Green
Write-Host ""
Write-Host "Done! Users can now refresh their browser to get admin access." -ForegroundColor Green
Write-Host ""
