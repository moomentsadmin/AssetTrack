#!/bin/bash
# Check what's happening on the server when login is attempted

echo "=========================================="
echo "Check Server Logs During Login Attempt"
echo "=========================================="
echo ""

echo "1. Current DATABASE_URL in .env:"
echo "----------------------------------------"
grep "DATABASE_URL" ~/.env 2>/dev/null || grep "DATABASE_URL" ~/AssetTrack/.env | sed 's/:[^:]*@/:***@/g'
echo ""

echo "2. PM2 Status:"
echo "----------------------------------------"
pm2 list
echo ""

echo "3. Last 50 lines of PM2 ERROR logs:"
echo "----------------------------------------"
pm2 logs asset-management --err --lines 50 --nostream
echo ""

echo "4. Last 30 lines of PM2 OUTPUT logs:"
echo "----------------------------------------"
pm2 logs asset-management --out --lines 30 --nostream
echo ""

echo "5. Testing API endpoints locally:"
echo "----------------------------------------"
echo "Testing /api/setup/status:"
timeout 5 curl -v http://localhost:5000/api/setup/status 2>&1 | head -30
echo ""

echo "6. Testing login endpoint:"
echo "----------------------------------------"
echo "Testing POST /api/login with timeout:"
timeout 10 curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bapt","password":"test"}' \
  -v 2>&1 | head -40
echo ""

echo "7. Check if DATABASE_URL has sslmode=disable:"
echo "----------------------------------------"
source ~/AssetTrack/.env
if echo "$DATABASE_URL" | grep -q "sslmode=disable"; then
    echo "✅ sslmode=disable is present in DATABASE_URL"
else
    echo "❌ sslmode=disable is MISSING from DATABASE_URL"
    echo "Current DATABASE_URL pattern:"
    echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/g'
fi
echo ""

echo "8. Direct database connection test:"
echo "----------------------------------------"
source ~/AssetTrack/.env
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "Testing psql connection (should be instant)..."
time PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM users;" 2>&1
echo ""

echo "9. Check Nginx error logs:"
echo "----------------------------------------"
sudo tail -30 /var/log/nginx/error.log | grep -v "ssl_stapling"
echo ""

echo "=========================================="
echo "DIAGNOSIS"
echo "=========================================="
echo ""
echo "If you see SSL errors in PM2 logs:"
echo "  → DATABASE_URL still has SSL enabled"
echo "  → Run: ./fix-database-url.sh"
echo ""
echo "If psql connection is slow:"
echo "  → Database connection issue"
echo ""
echo "If API endpoints timeout locally:"
echo "  → App is hanging on database queries"
echo "=========================================="
