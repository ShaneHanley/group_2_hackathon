-- SQL script to assign admin role to all existing users
-- Run this in your PostgreSQL database

-- Step 1: Ensure admin role exists
INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at)
SELECT gen_random_uuid(), 'admin', NULL, '["manage_users", "manage_roles", "view_audit", "manage_system"]'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

-- Step 2: Get admin role ID (for reference)
-- SELECT id FROM roles WHERE name = 'admin';

-- Step 3: Assign admin role to all active users
INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at)
SELECT 
    gen_random_uuid(),
    u.id,
    r.id,
    u.id, -- granted by themselves (or use a specific admin user ID)
    NOW()
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin'
  AND u.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = u.id 
      AND ur.role_id = r.id
  );

-- Step 4: Verify assignments
SELECT 
    u.email,
    u.display_name,
    u.status,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.status = 'active'
ORDER BY u.email, r.name;

