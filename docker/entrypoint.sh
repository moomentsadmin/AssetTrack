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
  
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
  attempt=$((attempt + 1))
done

# Run database migrations
echo "Running database migrations..."
cd /app
npm run db:push

if [ $? -eq 0 ]; then
  echo "Database migrations completed successfully"
else
  echo "Database migrations failed"
  exit 1
fi

# Start the application
echo "Starting the application..."
echo "======================================="
exec npm start
