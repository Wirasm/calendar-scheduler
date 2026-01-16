-- Cleanup script for old tables
-- Run this in Supabase SQL Editor before running migrations

-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any scheduling tables if they exist (for clean slate)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS availability_windows CASCADE;
DROP TABLE IF EXISTS event_types CASCADE;

-- Clear drizzle migration history if it exists
DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE;
DROP SCHEMA IF EXISTS drizzle CASCADE;

-- Verify cleanup
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
