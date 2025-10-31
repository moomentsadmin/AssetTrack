#!/bin/sh
# Entrypoint script for production container
# Runs database migrations before starting the application

echo "Starting Asset Management System..."
echo "======================================="

# Wait for database to be ready
echo "Waiting for database..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  echo "Attempt $attempt/$max_attempts: Checking database connection..."
  if pg_isready -h ${PGHOST:-db} -p ${PGPORT:-5432} -U ${PGUSER:-asset_user}; then
    echo "Database is ready!"
    break
  fi
  
  if [ $attempt -eq $max_attempts ]; then
    echo "Warning: Max attempts reached. Will try to continue anyway..."
  fi
  
  echo "Database not ready yet. Waiting 2 seconds..."
  sleep 2
  attempt=$((attempt+1))
done

# Run database migrations (allow failure)
echo "Running database migrations..."
npx drizzle-kit push 2>&1 || echo "Migration skipped (may already be up-to-date)"

echo ""
echo "Starting application server..."
echo "======================================="

# Execute the command passed to the container (defaults to "node dist/index.js")
exec "$@"
