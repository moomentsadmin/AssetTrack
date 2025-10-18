#!/bin/bash
# Quick fix for 504 Gateway Timeout error

echo "=========================================="
echo "Quick Fix for 504 Gateway Timeout"
echo "=========================================="
echo ""

echo "Step 1: Checking PM2 status..."
pm2 list

echo ""
echo "Step 2: Restarting PM2 application..."
pm2 restart asset-management

echo ""
echo "Step 3: Waiting for app to start..."
sleep 3

echo ""
echo "Step 4: Testing if app is responding..."
HEALTH_CHECK=$(curl -s http://localhost:5000/health)

if [ $? -eq 0 ]; then
    echo "✅ App is responding!"
    echo "Response: $HEALTH_CHECK"
else
    echo "❌ App is not responding on port 5000"
    echo ""
    echo "Checking error logs..."
    pm2 logs asset-management --err --lines 20 --nostream
fi

echo ""
echo "Step 5: Checking PM2 status again..."
pm2 list

echo ""
echo "=========================================="
echo "Now try logging in at: https://asset.digile.com"
echo ""
echo "If still getting 504 error, run:"
echo "  pm2 logs asset-management --lines 100"
echo "=========================================="
