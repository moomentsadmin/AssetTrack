#!/bin/bash
# Quick Fix Script for Production 404 Error
# Run this on your production server

set -e

echo "🔧 Fixing Production 404 Error"
echo "================================"
echo ""

# Check if running in correct directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml not found"
    echo "Please cd to ~/AssetTrack first"
    exit 1
fi

# Step 1: Pull latest changes
echo "📥 Step 1/7: Pulling latest changes..."
git pull origin main

# Step 2: Stop services
echo "🛑 Step 2/7: Stopping services..."
docker compose -f docker-compose.production.yml down

# Step 3: Clean up
echo "🧹 Step 3/7: Cleaning up old containers and images..."
docker system prune -f

# Step 4: Rebuild application (no cache)
echo "🔨 Step 4/7: Rebuilding application from scratch..."
echo "This may take 3-5 minutes..."
docker compose -f docker-compose.production.yml build --no-cache app

# Step 5: Verify build
echo "✅ Step 5/7: Verifying build output..."
BUILD_CHECK=$(docker run --rm $(docker images -q | head -1) ls /app/dist/public/index.html 2>/dev/null || echo "FAILED")

if [ "$BUILD_CHECK" = "FAILED" ]; then
    echo "❌ Build verification failed!"
    echo ""
    echo "dist/public/index.html not found in container"
    echo "Please check build logs above for errors"
    exit 1
fi

echo "✅ Build verified - frontend files exist"

# Step 6: Start services
echo "🚀 Step 6/7: Starting services..."
docker compose -f docker-compose.production.yml up -d

# Step 7: Wait and verify
echo "⏳ Step 7/7: Waiting for services to start..."
sleep 20

echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "📝 Recent Application Logs:"
docker compose -f docker-compose.production.yml logs app --tail=20

echo ""
echo "================================"
echo "✅ Fix Complete!"
echo ""
echo "🔍 Verify the fix:"
echo "  1. Check container status above (should be 'running' and 'healthy')"
echo "  2. Visit: https://asset.digile.com"
echo "  3. You should see the setup screen or login page"
echo ""
echo "📊 Monitor logs:"
echo "  docker compose -f docker-compose.production.yml logs -f app"
echo ""
echo "❓ Still seeing 404?"
echo "  Run these diagnostic commands:"
echo "  docker compose -f docker-compose.production.yml exec app ls -la /app/dist/public/"
echo "  docker compose -f docker-compose.production.yml exec app curl -I http://localhost:5000"
echo ""
