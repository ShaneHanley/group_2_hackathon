# PowerShell script to check existing users in the database
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Users in IAM Database" -ForegroundColor Cyan
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

Write-Host "Querying database for users..." -ForegroundColor Green
Write-Host ""

# Query users
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT email, display_name, status, created_at FROM users ORDER BY created_at;" 2>&1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Users with Admin Role:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Query users with admin role
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT u.email, u.display_name, u.status FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'admin' ORDER BY u.email;" 2>&1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

