#!/bin/bash
# Quick fix script for 502 Bad Gateway error
# Run this on your Ubuntu server: ./fix-deployment.sh

set -e

echo "========================================"
echo "Asset Management - Quick Fix"
echo "========================================"
echo ""

# Navigate to app directory
cd ~/AssetTrack

echo "📥 Pulling latest code..."
git pull origin main
echo "✓ Code updated"
echo ""

echo "🧹 Cleaning up old PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 save --force
echo "✓ Old processes removed"
echo ""

echo "📦 Installing dependencies..."
npm ci
echo "✓ Dependencies installed"
echo ""

echo "🗄️  Running database migrations..."
npx drizzle-kit push
echo "✓ Migrations complete"
echo ""

echo "🔨 Building application..."
npm run build
echo "✓ Build complete"
echo ""

echo "📁 Creating logs directory..."
mkdir -p logs
echo "✓ Logs directory ready"
echo ""

echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.cjs
pm2 save
echo "✓ PM2 started"
echo ""

echo "📊 Current status:"
pm2 status
echo ""

echo "🔍 Testing local connection..."
sleep 2
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ App is running!"
    echo ""
    echo "Now reload Nginx:"
    echo "  sudo systemctl reload nginx"
    echo ""
    echo "Then visit: https://asset.digile.com"
else
    echo "❌ App not responding. Check logs:"
    echo "  pm2 logs asset-management"
fi
echo ""
