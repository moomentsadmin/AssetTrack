#!/bin/sh
# Entrypoint script for production container
# Runs database migrations before starting the application when enabled.

set -e

echo "Starting Asset Management System..."
echo "======================================="

# Minimal wait for database service to be available. In many deployments the
# orchestrator or healthchecks will handle readiness; this is a short pause.
echo "Waiting briefly for database (5s)..."
sleep 5

# Run database migrations only when explicitly enabled. This avoids accidental
# schema changes during rolling deploys or when using external migration tooling.
# Set ENABLE_AUTO_MIGRATIONS=true to enable automatic migration runs inside the
# container at startup. Default: disabled (false).
if [ "${ENABLE_AUTO_MIGRATIONS}" = "true" ]; then
	if [ -z "${DATABASE_URL}" ]; then
		echo "ENABLE_AUTO_MIGRATIONS=true but DATABASE_URL is not set; skipping migrations"
	else
		echo "Running database migrations (drizzle-kit) from image..."
		# Use explicit drizzle-kit command that targets Postgres and picks up DATABASE_URL
		if npx drizzle-kit push:pg --env DATABASE_URL; then
			echo "Migrations completed successfully"
		else
			echo "Migrations failed or were skipped"
		fi
	fi
else
	echo "Automatic migrations are disabled (ENABLE_AUTO_MIGRATIONS != true)."
fi

echo ""
echo "Starting application server..."
echo "======================================="

# Execute the command passed to the container (defaults to "node dist/index.js")
exec "$@"
