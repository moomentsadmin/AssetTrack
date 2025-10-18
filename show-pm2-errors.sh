#!/bin/bash
# Show PM2 logs and errors

echo "=========================================="
echo "PM2 Error Diagnostics"
echo "=========================================="
echo ""

echo "1. PM2 Status:"
echo "----------------------------------------"
pm2 list

echo ""
echo "2. Last 100 lines of PM2 logs:"
echo "----------------------------------------"
pm2 logs asset-management --lines 100 --nostream

echo ""
echo "3. PM2 Error logs only:"
echo "----------------------------------------"
pm2 logs asset-management --err --lines 50 --nostream

echo ""
echo "4. Testing actual page request (not just /health):"
echo "----------------------------------------"
echo "Testing: curl http://localhost:5000/"
timeout 10 curl -v http://localhost:5000/ 2>&1 | head -100

echo ""
echo "5. Testing API endpoint:"
echo "----------------------------------------"
echo "Testing: curl http://localhost:5000/api/user"
timeout 10 curl -v http://localhost:5000/api/user 2>&1 | head -100

echo ""
echo "6. Nginx Error Logs:"
echo "----------------------------------------"
sudo tail -30 /var/log/nginx/error.log

echo ""
echo "7. Nginx Timeout Configuration:"
echo "----------------------------------------"
grep -i timeout /etc/nginx/sites-available/asset-management | head -10

echo ""
echo "=========================================="
echo "Analysis:"
echo "=========================================="
echo ""
echo "If you see 'timeout' or 'upstream timed out' in nginx logs:"
echo "  → The app is hanging on requests"
echo "  → Check PM2 logs for database errors"
echo ""
echo "If PM2 logs show database errors:"
echo "  → Check database connection"
echo "  → Verify DATABASE_URL in .env"
echo ""
echo "If nginx timeout is less than 60s:"
echo "  → Increase proxy_read_timeout in nginx config"
echo ""
