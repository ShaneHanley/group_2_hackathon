-- Seed default roles
INSERT INTO roles (id, name, department_scope, permissions, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'admin', NULL, '["manage_users", "manage_roles", "view_audit", "manage_system"]'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'staff', NULL, '["create_posts", "edit_timetable", "manage_equipment"]'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'student', NULL, '["view_resources", "book_equipment", "view_timetable"]'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'developer', NULL, '["api_register", "api_manage_clients"]'::jsonb, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles (id, user_id, role_id, granted_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u, roles r
WHERE u.email = 'admin@csis.edu' AND r.name = 'admin'
ON CONFLICT DO NOTHING;

