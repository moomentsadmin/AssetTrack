#!/bin/bash
# Debug why the app is hanging

echo "=========================================="
echo "Debug Application Hanging Issue"
echo "=========================================="
echo ""

echo "1. PM2 Status:"
echo "----------------------------------------"
pm2 list

echo ""
echo "2. Testing health endpoint (should work fast):"
echo "----------------------------------------"
time curl -s http://localhost:5000/health
echo ""

echo ""
echo "3. Testing root page (this might hang):"
echo "----------------------------------------"
echo "Attempting to load homepage with 10-second timeout..."
timeout 10 curl -v http://localhost:5000/ 2>&1 | head -50

echo ""
echo "4. PM2 Logs (last 100 lines):"
echo "----------------------------------------"
pm2 logs asset-management --lines 100 --nostream

echo ""
echo "5. Testing database connection from app's perspective:"
echo "----------------------------------------"

# Load environment
if [ -f ~/AssetTrack/.env ]; then
    source ~/AssetTrack/.env
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    echo ""
    echo "Testing direct database query..."
    PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM users;" 2>&1
else
    echo "❌ .env file not found"
fi

echo ""
echo "6. Checking if app is actually responding to any requests:"
echo "----------------------------------------"
echo "Making multiple test requests..."

for i in {1..3}; do
    echo "Request $i:"
    timeout 5 curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" http://localhost:5000/health
    sleep 1
done

echo ""
echo "7. Checking Node.js process:"
echo "----------------------------------------"
ps aux | grep -E "node|PM2" | grep -v grep

echo ""
echo "8. Checking if port 5000 is listening:"
echo "----------------------------------------"
sudo netstat -tlnp | grep 5000

echo ""
echo "9. Recent Nginx error logs:"
echo "----------------------------------------"
sudo tail -50 /var/log/nginx/error.log | grep -v "ssl_stapling" | tail -20

echo ""
echo "10. Testing API endpoints:"
echo "----------------------------------------"
echo "Testing /api/user (requires auth, will fail but shouldn't hang):"
timeout 5 curl -v http://localhost:5000/api/user 2>&1 | head -20

echo ""
echo "=========================================="
echo "Analysis"
echo "=========================================="
echo ""
echo "If /health works but / hangs:"
echo "  → App has issue loading main page (likely database/session issue)"
echo ""
echo "If PM2 logs show database errors:"
echo "  → Database connection/permission problem"
echo ""
echo "If no logs appear when making requests:"
echo "  → App isn't receiving requests (Nginx routing issue)"
echo ""
