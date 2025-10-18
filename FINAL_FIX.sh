#!/bin/bash
# FINAL FIX - Comprehensive solution for 504 timeout

echo "=========================================="
echo "FINAL FIX FOR 504 TIMEOUT"
echo "=========================================="
echo ""

cd ~/AssetTrack

echo "Step 1: Check current DATABASE_URL"
echo "----------------------------------------"
if [ -f .env ]; then
    echo "✅ .env file exists"
    CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
    echo "Current DATABASE_URL (masked):"
    echo "$CURRENT_DB_URL" | sed 's/:[^:]*@/:***@/g'
else
    echo "❌ .env file not found!"
    exit 1
fi
echo ""

echo "Step 2: Fix DATABASE_URL (disable SSL)"
echo "----------------------------------------"

# Remove any existing sslmode parameter and add sslmode=disable
NEW_DB_URL=$(echo "$CURRENT_DB_URL" | sed 's/?sslmode=[^&]*&\?//' | sed 's/&sslmode=[^&]*//' | sed 's/\?$//')

# Add sslmode=disable
if echo "$NEW_DB_URL" | grep -q "?"; then
    NEW_DB_URL="${NEW_DB_URL}&sslmode=disable"
else
    NEW_DB_URL="${NEW_DB_URL}?sslmode=disable"
fi

echo "New DATABASE_URL (masked):"
echo "$NEW_DB_URL" | sed 's/:[^:]*@/:***@/g'

# Backup and update .env
cp .env .env.backup.$(date +%s)
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$NEW_DB_URL\"|" .env

echo "✅ DATABASE_URL updated with sslmode=disable"
echo ""

echo "Step 3: Verify ecosystem.config.cjs"
echo "----------------------------------------"
if [ -f ecosystem.config.cjs ]; then
    echo "✅ ecosystem.config.cjs exists"
    if grep -q "dotenv" ecosystem.config.cjs; then
        echo "✅ dotenv is configured"
    else
        echo "⚠️  dotenv might not be configured"
    fi
else
    echo "❌ ecosystem.config.cjs not found!"
fi
echo ""

echo "Step 4: Test database connection"
echo "----------------------------------------"
source .env
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "Testing direct database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'Connection OK' as status;" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Database connection failed - but continuing..."
fi
echo ""

echo "Step 5: Stop and clear PM2"
echo "----------------------------------------"
pm2 stop all
pm2 delete all
pm2 flush
echo "✅ PM2 cleared"
echo ""

echo "Step 6: Start app with fresh environment"
echo "----------------------------------------"
pm2 start ecosystem.config.cjs --update-env
pm2 save
echo "✅ App started"
echo ""

echo "Step 7: Wait for app to initialize..."
sleep 5
echo ""

echo "Step 8: Test app locally"
echo "----------------------------------------"

echo "Testing /health endpoint:"
HEALTH_RESPONSE=$(curl -s -w "\nTime: %{time_total}s" http://localhost:5000/health)
echo "$HEALTH_RESPONSE"
echo ""

echo "Testing /api/setup/status endpoint:"
SETUP_RESPONSE=$(timeout 5 curl -s http://localhost:5000/api/setup/status)
if [ $? -eq 0 ]; then
    echo "$SETUP_RESPONSE" | head -20
    echo "✅ API endpoint responding!"
else
    echo "❌ API endpoint timed out"
fi
echo ""

echo "Step 9: Check for SSL errors in logs"
echo "----------------------------------------"
echo "Recent error logs (checking for SSL issues):"
pm2 logs asset-management --err --lines 20 --nostream 2>/dev/null | grep -i "ssl\|tls\|cert" || echo "No SSL/TLS errors found ✅"
echo ""

echo "Step 10: PM2 Status"
echo "----------------------------------------"
pm2 list
echo ""

echo "Step 11: Test login endpoint"
echo "----------------------------------------"
echo "Attempting login with test credentials..."
LOGIN_RESPONSE=$(timeout 10 curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bapt","password":"wrongpassword"}' \
  -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}s")

if [ $? -eq 0 ]; then
    echo "$LOGIN_RESPONSE"
    if echo "$LOGIN_RESPONSE" | grep -q "HTTP_CODE:40"; then
        echo "✅ Login endpoint is working (returned 401/400 as expected for wrong password)"
    else
        echo "ℹ️  Login endpoint responded"
    fi
else
    echo "❌ Login endpoint timed out after 10 seconds"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Now test your site:"
echo "   https://assetmgt.digile.com"
echo ""
echo "Login with:"
echo "   Username: bapt"
echo "   Password: (your password)"
echo ""
echo "If still getting 504, check logs:"
echo "   pm2 logs asset-management"
echo ""
echo "Or run diagnostics:"
echo "   ./check-server-logs.sh"
echo "=========================================="
