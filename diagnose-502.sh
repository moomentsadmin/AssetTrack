#!/bin/bash
# Diagnose 502 Bad Gateway Error

echo "=========================================="
echo "502 Bad Gateway Diagnostic Tool"
echo "=========================================="
echo ""

echo "1. Checking PM2 Status..."
pm2 list
echo ""

echo "2. Checking if app is running on port 5000..."
curl -s http://localhost:5000/health || echo "❌ App NOT responding on port 5000"
echo ""

echo "3. Checking what's using port 5000..."
sudo lsof -i :5000 || echo "Nothing on port 5000"
echo ""

echo "4. Checking PM2 logs (last 30 lines)..."
pm2 logs asset-management --lines 30 --nostream || pm2 logs --lines 30 --nostream
echo ""

echo "5. Checking .env file exists..."
if [ -f ~/AssetTrack/.env ]; then
    echo "✅ .env file found"
    echo "Environment variables (masked):"
    cat ~/AssetTrack/.env | grep -v PASSWORD | grep -v SECRET
else
    echo "❌ .env file NOT found in ~/AssetTrack/"
fi
echo ""

echo "6. Checking Nginx configuration..."
sudo nginx -t
echo ""

echo "7. Checking Nginx error logs..."
sudo tail -n 20 /var/log/nginx/error.log
echo ""

echo "=========================================="
echo "Common Fixes:"
echo "1. Start PM2: cd ~/AssetTrack && pm2 start ecosystem.config.cjs"
echo "2. Restart PM2: pm2 restart asset-management"
echo "3. Check logs: pm2 logs asset-management"
echo "4. Verify .env: cat ~/AssetTrack/.env"
echo "=========================================="
