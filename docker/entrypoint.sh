#!/bin/sh
set -e

echo "Starting Asset Management System..."
echo "======================================="

echo "Waiting for database..."
sleep 5

echo "Running database migrations (non-interactive)..."
npx drizzle-kit push --force 2>&1 || echo "Migration skipped (may already be up-to-date)"

echo ""
echo "Starting application server..."
echo "======================================="

exec "$@"
