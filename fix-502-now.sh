#!/bin/bash
# Quick fix for 502 Bad Gateway

echo "=========================================="
echo "502 Bad Gateway - Quick Fix"
echo "=========================================="
echo ""

echo "Step 1: Stopping any existing PM2 processes..."
pm2 stop all
pm2 delete all
echo ""

echo "Step 2: Going to AssetTrack directory..."
cd ~/AssetTrack || { echo "❌ AssetTrack directory not found!"; exit 1; }
echo "✅ In $(pwd)"
echo ""

echo "Step 3: Pulling latest code..."
git pull origin main || echo "⚠️  Could not pull latest code (might be ok)"
echo ""

echo "Step 4: Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "You need to create .env file with:"
    echo "  DATABASE_URL=postgresql://..."
    echo "  SESSION_SECRET=..."
    echo "  NODE_ENV=production"
    exit 1
else
    echo "✅ .env file exists"
fi
echo ""

echo "Step 5: Installing dependencies..."
npm install --production
echo ""

echo "Step 6: Building application..."
npm run build || { echo "❌ Build failed!"; exit 1; }
echo ""

echo "Step 7: Running database migrations..."
npm run db:push || echo "⚠️  Database migrations might have failed"
echo ""

echo "Step 8: Starting with PM2..."
pm2 start ecosystem.config.cjs
pm2 save
echo ""

echo "Step 9: Waiting for app to start..."
sleep 5
echo ""

echo "Step 10: Testing app..."
HEALTH_CHECK=$(curl -s http://localhost:5000/health)

if [ $? -eq 0 ]; then
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "App is running!"
    echo "Response: $HEALTH_CHECK"
    echo ""
    echo "PM2 Status:"
    pm2 list
    echo ""
    echo "🌐 Now visit: https://assetmgt.digile.com"
else
    echo "❌ App is still not responding"
    echo ""
    echo "Checking PM2 logs..."
    pm2 logs asset-management --lines 50 --nostream
    echo ""
    echo "Run: pm2 logs asset-management"
fi

echo ""
echo "=========================================="
