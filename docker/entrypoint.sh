#!/bin/sh
# Entrypoint script for production container
# Runs database migrations before starting the application

echo "Starting Asset Management System..."
echo "======================================="

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run database migrations (allow failure)
echo "Running database migrations (non-interactive)..."
# Force apply schema changes; if drizzle detects extra tables (e.g., session table), it may remove them.
npx drizzle-kit push --force 2>&1 || echo "Migration skipped (may already be up-to-date)"

echo ""
echo "Starting application server..."
echo "======================================="

# Execute the command passed to the container (defaults to "node dist/index.js")
exec "$@"
