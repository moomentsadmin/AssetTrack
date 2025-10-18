#!/bin/bash
# Restart PM2 with correct environment variables

echo "=========================================="
echo "Restarting PM2 with .env loaded"
echo "=========================================="
echo ""

cd ~/AssetTrack

echo "🛑 Stopping PM2..."
pm2 stop asset-management 2>/dev/null || true
pm2 delete asset-management 2>/dev/null || true
echo "✓ Stopped"
echo ""

echo "🚀 Starting PM2 with new config..."
pm2 start ecosystem.config.cjs
pm2 save
echo "✓ Started"
echo ""

echo "⏳ Waiting 3 seconds for app to start..."
sleep 3
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "🔍 Testing connection..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ SUCCESS! App is running and responding!"
    echo ""
    echo "Now reload Nginx:"
    echo "  sudo systemctl reload nginx"
    echo ""
    echo "Then visit: https://asset.digile.com"
else
    echo "❌ App still not responding"
    echo ""
    echo "Check logs:"
    echo "  pm2 logs asset-management --lines 50"
    echo ""
    echo "Or check specific error log:"
    echo "  cat logs/err.log"
fi
echo ""
