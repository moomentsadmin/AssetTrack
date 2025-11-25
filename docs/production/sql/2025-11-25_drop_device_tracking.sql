-- Manual migration to remove deprecated device tracking tables.
-- Run only AFTER confirming data retention and audit requirements.
-- Example execution:
--   psql "$DATABASE_URL" -f docs/production/sql/2025-11-25_drop_device_tracking.sql

BEGIN;
  DROP TABLE IF EXISTS device_tracking_history;
  DROP TABLE IF EXISTS device_tracking;
COMMIT;

-- If using drizzle-kit and tables were already removed from schema, they may
-- already be marked for drop; prefer a controlled manual execution for safety.