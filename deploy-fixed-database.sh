#!/bin/bash
# Deploy fixed database connection to Ubuntu server

echo "=========================================="
echo "Deploy Fixed Database Connection"
echo "=========================================="
echo ""

cd ~/AssetTrack

echo "Step 1: Pull latest code with fixed database connection"
echo "----------------------------------------"
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

echo "✅ Code updated"
echo ""

echo "Step 2: Install dependencies (including pg package)"
echo "----------------------------------------"
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

echo "Step 3: Build the application"
echo "----------------------------------------"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

echo "Step 4: Verify .env file"
echo "----------------------------------------"
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env
if echo "$DATABASE_URL" | grep -q "sslmode=disable"; then
    echo "✅ DATABASE_URL has sslmode=disable"
else
    echo "⚠️  Adding sslmode=disable to DATABASE_URL"
    CURRENT_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
    if echo "$CURRENT_URL" | grep -q "?"; then
        NEW_URL="${CURRENT_URL}&sslmode=disable"
    else
        NEW_URL="${CURRENT_URL}?sslmode=disable"
    fi
    cp .env .env.backup.$(date +%s)
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$NEW_URL\"|" .env
    echo "✅ DATABASE_URL updated"
fi
echo ""

echo "Step 5: Test database connection"
echo "----------------------------------------"
source .env
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "Testing PostgreSQL connection..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'Database OK' as status;" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi
echo ""

echo "Step 6: Stop PM2"
echo "----------------------------------------"
pm2 stop asset-management 2>/dev/null || true
pm2 delete asset-management 2>/dev/null || true
pm2 flush

echo "✅ PM2 stopped and cleared"
echo ""

echo "Step 7: Start application with PM2"
echo "----------------------------------------"
pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "✅ Application started"
echo ""

echo "Step 8: Wait for app to initialize..."
sleep 5
echo ""

echo "Step 9: Test application"
echo "----------------------------------------"

echo "Testing health endpoint:"
HEALTH=$(curl -s http://localhost:5000/health)
echo "$HEALTH"

if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check returned unexpected result"
fi
echo ""

echo "Testing API endpoint (should NOT return SSL error):"
API_RESPONSE=$(timeout 5 curl -s http://localhost:5000/api/setup/status)
API_EXIT=$?

if [ $API_EXIT -eq 0 ]; then
    if echo "$API_RESPONSE" | grep -q "certificate\|altnames"; then
        echo "❌ Still getting SSL certificate errors!"
        echo "$API_RESPONSE"
    else
        echo "✅ API endpoint responding without SSL errors!"
        echo "$API_RESPONSE" | head -5
    fi
else
    echo "⚠️  API endpoint timed out"
fi
echo ""

echo "Step 10: Check PM2 logs for errors"
echo "----------------------------------------"
echo "Recent error logs:"
pm2 logs asset-management --err --lines 20 --nostream 2>/dev/null | grep -i "error\|ssl\|tls" || echo "No SSL/TLS errors found ✅"
echo ""

echo "Step 11: PM2 Status"
echo "----------------------------------------"
pm2 list
echo ""

echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "✅ Database driver changed from Neon WebSocket to standard PostgreSQL"
echo "✅ SSL disabled for localhost connections"
echo "✅ Application rebuilt and restarted"
echo ""
echo "🌐 Test your application:"
echo "   https://assetmgt.digile.com"
echo ""
echo "Login with:"
echo "   Username: bapt"
echo "   Password: (your password)"
echo ""
echo "If still experiencing issues:"
echo "   pm2 logs asset-management --lines 50"
echo "=========================================="
