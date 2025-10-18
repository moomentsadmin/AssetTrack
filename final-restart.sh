#!/bin/bash
# Final restart with direct node execution

echo "=========================================="
echo "Final PM2 Restart"
echo "=========================================="
echo ""

cd ~/AssetTrack

echo "🛑 Stopping PM2..."
pm2 stop asset-management
pm2 delete asset-management
echo "✓ Stopped"
echo ""

echo "🚀 Starting with new config (direct node execution)..."
pm2 start ecosystem.config.cjs
pm2 save
echo "✓ Started"
echo ""

echo "⏳ Waiting 3 seconds..."
sleep 3
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "🔍 Testing health endpoint..."
HEALTH_CHECK=$(curl -s http://localhost:5000/health 2>&1)
echo "Response: $HEALTH_CHECK"
echo ""

if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "App is running perfectly!"
    echo ""
    echo "🌐 Visit your website:"
    echo "   https://asset.digile.com"
    echo ""
else
    echo "Testing API endpoint..."
    curl -s http://localhost:5000/api/setup/status
    echo ""
    echo ""
    echo "If you see JSON response above, the app is working!"
    echo "Visit: https://asset.digile.com"
fi
echo ""
