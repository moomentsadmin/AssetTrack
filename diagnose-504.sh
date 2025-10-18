#!/bin/bash
# Diagnose 504 Gateway Timeout errors

echo "=========================================="
echo "504 Gateway Timeout Diagnostics"
echo "=========================================="
echo ""

# Load environment
if [ -f ~/AssetTrack/.env ]; then
    source ~/AssetTrack/.env
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
    echo "❌ .env file not found"
    exit 1
fi

echo "1. PM2 Status:"
echo "----------------------------------------"
pm2 list
echo ""

echo "2. PM2 Logs (last 30 lines):"
echo "----------------------------------------"
pm2 logs asset-management --lines 30 --nostream
echo ""

echo "3. Local Health Check:"
echo "----------------------------------------"
curl -v http://localhost:5000/health
echo ""

echo "4. Database Connection Test:"
echo "----------------------------------------"
echo "Testing: psql -h localhost -U $DB_USER -d $DB_NAME"
PGPASSWORD="$PGPASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 as test;" 2>&1
echo ""

echo "5. Database Permissions:"
echo "----------------------------------------"
sudo -u postgres psql -d "$DB_NAME" <<EOF
-- Check schema owner
SELECT nspname AS schema_name, 
       pg_get_userbyid(nspowner) AS owner 
FROM pg_namespace 
WHERE nspname = 'public';

-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee = '$DB_USER' 
LIMIT 5;
EOF
echo ""

echo "6. Nginx Configuration:"
echo "----------------------------------------"
echo "Checking /etc/nginx/sites-available/asset-management"
if [ -f /etc/nginx/sites-available/asset-management ]; then
    grep -A 5 "server_name\|proxy_pass\|proxy_read_timeout" /etc/nginx/sites-available/asset-management
else
    echo "❌ Nginx config not found"
fi
echo ""

echo "7. Nginx Error Logs (last 20 lines):"
echo "----------------------------------------"
sudo tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"
echo ""

echo "8. Testing API Endpoint:"
echo "----------------------------------------"
echo "Testing /api/user endpoint..."
curl -v -m 10 http://localhost:5000/api/user 2>&1 | head -30
echo ""

echo "9. PostgreSQL Service Status:"
echo "----------------------------------------"
sudo systemctl status postgresql --no-pager | head -15
echo ""

echo "10. Port Listening:"
echo "----------------------------------------"
sudo netstat -tlnp | grep -E ':(5000|80|443|5432)'
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
echo ""
echo "Common 504 Causes:"
echo "  1. Database connection timeout"
echo "  2. App hanging on queries (permission denied)"
echo "  3. Nginx timeout too short"
echo "  4. PM2 app crashed but showing as online"
echo ""
echo "Next Steps:"
echo "  1. If database permissions show errors → Run: sudo ./complete-server-fix.sh"
echo "  2. If nginx timeout is short → Increase proxy_read_timeout"
echo "  3. If app logs show errors → Check PM2 logs"
