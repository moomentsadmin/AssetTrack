#!/bin/sh
# Entrypoint script for production container
# Runs database migrations before starting the application

set -e

echo "🚀 Starting Asset Management System..."
echo "======================================="

# Run database migrations
echo "📦 Running database migrations..."
if npm run db:push; then
    echo "✅ Database migrations completed successfully"
else
    echo "⚠️  Database migration failed, but continuing..."
    echo "   (This is expected on first run or if schema is already up-to-date)"
fi

echo ""
echo "🎯 Starting application server..."
echo "======================================="

# Execute the command passed to the container (defaults to "node dist/index.js")
exec "$@"
