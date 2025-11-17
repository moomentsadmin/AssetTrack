#!/bin/bash
set -e

echo "=========================================="
echo "AssetTrack Database Migration Script"
echo "=========================================="
echo ""

cd "$(dirname "$0")" || exit 1

# Step 1: Backup original docker-compose.yml
echo "[1/6] Backing up docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak
echo "  ✓ Backup saved to docker-compose.yml.bak"
echo ""

# Step 2: Add ports mapping to db service
echo "[2/6] Adding port 5432 mapping to db service in docker-compose.yml..."
# Use sed to insert "    ports:" after the "container_name: asset-db" line
sed -i '/container_name: asset-db/a\    ports:\n      - "5432:5432"' docker-compose.yml
echo "  ✓ Port mapping added"
echo ""

# Step 3: Restart db service
echo "[3/6] Restarting database service..."
docker-compose down
docker-compose up -d db
echo "  Waiting for database to be healthy..."
sleep 15
echo "  ✓ Database service restarted with port exposed"
echo ""

# Step 4: Run migrations from host
echo "[4/6] Running database migrations..."
export DATABASE_URL="postgres://asset_user:your_secure_password@localhost:5432/asset_management"
if npm run db:push; then
  echo "  ✓ Migrations completed successfully"
else
  echo "  ✗ Migration failed. Restoring docker-compose.yml and exiting..."
  mv docker-compose.yml.bak docker-compose.yml
  docker-compose down
  docker-compose up -d db
  exit 1
fi
echo ""

# Step 5: Revert docker-compose.yml and restart db
echo "[5/6] Cleaning up: removing port mapping and restarting db..."
mv docker-compose.yml.bak docker-compose.yml
docker-compose down
docker-compose up -d db
echo "  Waiting for database to be healthy..."
sleep 10
echo "  ✓ Database restarted without exposed port"
echo ""

# Step 6: Restart app and verify
echo "[6/6] Restarting app service and verifying health..."
docker-compose up -d app
echo "  Waiting for app to start..."
sleep 20

# Check health
HEALTH_CHECK=$(curl -s http://localhost:5000/api/health || echo "failed")
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
  echo "  ✓ Health check passed: $HEALTH_CHECK"
else
  echo "  ✗ Health check failed. Last 50 app logs:"
  docker-compose logs --tail=50 app
  exit 1
fi
echo ""

echo "=========================================="
echo "✓ Migration completed successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Database schema created"
echo "  - Port 5432 mapping removed (secure)"
echo "  - Application is running and healthy"
echo ""
echo "Next steps:"
echo "  1. View full logs: docker-compose logs --tail=100 app"
echo "  2. Access app at: http://localhost:5000"
echo ""
