#!/bin/bash
# Restart app with fresh environment

echo "=========================================="
echo "Restart App with Fresh Environment"
echo "=========================================="
echo ""

echo "1. Checking .env file:"
echo "----------------------------------------"
if [ -f ~/AssetTrack/.env ]; then
    echo "✅ .env file exists"
    echo ""
    echo "DATABASE_URL is set: $(grep -c DATABASE_URL ~/AssetTrack/.env)"
    echo "SESSION_SECRET is set: $(grep -c SESSION_SECRET ~/AssetTrack/.env)"
    echo "NODE_ENV is set: $(grep -c NODE_ENV ~/AssetTrack/.env)"
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "2. Stopping PM2:"
echo "----------------------------------------"
pm2 stop all
pm2 delete all

echo ""
echo "3. Clearing PM2 logs:"
echo "----------------------------------------"
pm2 flush

echo ""
echo "4. Starting app with fresh environment:"
echo "----------------------------------------"
cd ~/AssetTrack
pm2 start ecosystem.config.cjs --update-env
pm2 save

echo ""
echo "5. Waiting for app to start..."
sleep 3

echo ""
echo "6. PM2 Status:"
echo "----------------------------------------"
pm2 list

echo ""
echo "7. Testing app:"
echo "----------------------------------------"
echo "Health check:"
curl -s http://localhost:5000/health
echo ""

echo ""
echo "Homepage test (10 second timeout):"
timeout 10 curl -I http://localhost:5000/ 2>&1 | head -20

echo ""
echo "8. Recent PM2 logs:"
echo "----------------------------------------"
pm2 logs asset-management --lines 30 --nostream

echo ""
echo "=========================================="
echo "If the app is running, try:"
echo "  https://assetmgt.digile.com"
echo ""
echo "If still getting 504, run:"
echo "  ./debug-app-hang.sh"
echo "=========================================="
