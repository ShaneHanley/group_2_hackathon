@echo off
REM Batch script to assign admin role to all existing users
echo ========================================
echo Assigning Admin Role to Users
echo ========================================
echo.

echo Step 1: Checking if 'admin' role exists...
docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM roles WHERE name = 'admin';" > temp_role.txt 2>&1
set /p ADMIN_ROLE_ID=<temp_role.txt
set ADMIN_ROLE_ID=%ADMIN_ROLE_ID: =%

if "%ADMIN_ROLE_ID%"=="" (
    echo Admin role does not exist. Creating it...
    docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at) VALUES (gen_random_uuid(), 'admin', NULL, '[\"manage_users\", \"manage_roles\", \"view_audit\", \"manage_system\"]'::jsonb, NOW(), NOW()) ON CONFLICT DO NOTHING;" >nul 2>&1
    docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM roles WHERE name = 'admin';" > temp_role.txt 2>&1
    set /p ADMIN_ROLE_ID=<temp_role.txt
    set ADMIN_ROLE_ID=%ADMIN_ROLE_ID: =%
    echo Admin role created
) else (
    echo Admin role exists
)

echo.
echo Step 2: Getting list of all active users...
docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id, email FROM users WHERE status = 'active';" > temp_users.txt 2>&1

echo.
echo Step 3: Assigning admin role to all active users...
echo.

set USER_COUNT=0
set ASSIGNED_COUNT=0

for /f "tokens=1,2 delims=|" %%a in (temp_users.txt) do (
    set USER_ID=%%a
    set USER_EMAIL=%%b
    set USER_ID=!USER_ID: =!
    set USER_EMAIL=!USER_EMAIL: =!
    
    if not "!USER_ID!"=="" if not "!USER_EMAIL!"=="" (
        set /a USER_COUNT+=1
        echo Processing: !USER_EMAIL!
        
        REM Check if user already has admin role
        docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM user_roles WHERE user_id = '!USER_ID!' AND role_id = '%ADMIN_ROLE_ID%';" > temp_check.txt 2>&1
        set /p EXISTING_ROLE=<temp_check.txt
        set EXISTING_ROLE=!EXISTING_ROLE: =!
        
        if "!EXISTING_ROLE!"=="" (
            REM Assign admin role
            docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) SELECT gen_random_uuid(), '!USER_ID!', '%ADMIN_ROLE_ID!', '!USER_ID!', NOW() WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '!USER_ID!' AND role_id = '%ADMIN_ROLE_ID%');" >nul 2>&1
            if !ERRORLEVEL! EQU 0 (
                echo   Admin role assigned
                set /a ASSIGNED_COUNT+=1
            ) else (
                echo   Failed to assign role
            )
        ) else (
            echo   Already has admin role
            set /a ASSIGNED_COUNT+=1
        )
    )
)

echo.
echo ========================================
echo Summary
echo ========================================
echo Total users processed: %USER_COUNT%
echo Users with admin role: %ASSIGNED_COUNT%
echo.
echo Done! Users can now refresh their browser to get admin access.
echo.

del temp_role.txt temp_users.txt temp_check.txt 2>nul
pause

