#!/bin/bash
# Check PM2 status and logs

echo "=========================================="
echo "PM2 Status Check"
echo "=========================================="
echo ""

echo "1. PM2 Process Status:"
pm2 list

echo ""
echo "2. PM2 Error Logs (last 50 lines):"
pm2 logs asset-management --err --lines 50 --nostream

echo ""
echo "3. PM2 Output Logs (last 30 lines):"
pm2 logs asset-management --out --lines 30 --nostream

echo ""
echo "4. Check if app is responding on port 5000:"
curl -s http://localhost:5000/health || echo "❌ App not responding"

echo ""
echo "5. Database connection test:"
psql -h localhost -U asset_user -d asset_management -c "SELECT COUNT(*) FROM users;" 2>&1 | head -5

echo ""
echo "=========================================="
echo "If app is crashed, restart with:"
echo "  pm2 restart asset-management"
echo "  pm2 logs asset-management"
echo "=========================================="
