-- Activate a user by email
-- Run this in PostgreSQL to activate a user account

UPDATE users 
SET status = 'active' 
WHERE email = 'admin@csis.edu';

