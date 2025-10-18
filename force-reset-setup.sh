#!/bin/bash
# Force reset setup - handles both empty table and existing rows

echo "=========================================="
echo "Force Reset Setup Status"
echo "=========================================="
echo ""

cd ~/AssetTrack

echo "Checking current system settings..."
CURRENT_SETUP=$(psql -h localhost -U asset_user -d asset_management -t -c "SELECT setup_completed FROM system_settings LIMIT 1;" 2>/dev/null | xargs)

if [ -z "$CURRENT_SETUP" ]; then
    echo "⚠️  No system_settings row exists - creating one..."
    psql -h localhost -U asset_user -d asset_management <<EOF
INSERT INTO system_settings (setup_completed, company_name, default_currency) 
VALUES (false, 'Asset Management System', 'USD')
ON CONFLICT DO NOTHING;
EOF
    echo "✅ System settings row created with setup_completed = false"
else
    echo "Current setup_completed: $CURRENT_SETUP"
    echo ""
    echo "Updating to setup_completed = false..."
    psql -h localhost -U asset_user -d asset_management <<EOF
UPDATE system_settings SET setup_completed = false;
EOF
    echo "✅ Setup status updated to false"
fi

echo ""
echo "Verifying change..."
VERIFY=$(psql -h localhost -U asset_user -d asset_management -t -c "SELECT setup_completed FROM system_settings LIMIT 1;" 2>/dev/null | xargs)
echo "Current setup_completed: $VERIFY"
echo ""

if [ "$VERIFY" = "f" ] || [ "$VERIFY" = "false" ]; then
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "Setup status is now FALSE"
    echo ""
    echo "🔄 Restarting PM2 to clear cache..."
    pm2 restart asset-management
    sleep 2
    echo ""
    echo "🌐 Now visit: https://asset.digile.com"
    echo ""
    echo "You MUST see the setup page (not login page)"
    echo "If you still see login, try:"
    echo "  - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
    echo "  - Clear browser cache"
    echo "  - Open in incognito/private window"
else
    echo "❌ Something went wrong - setup_completed is still: $VERIFY"
    echo ""
    echo "Run this SQL manually:"
    echo "  psql -h localhost -U asset_user -d asset_management"
    echo "  DELETE FROM system_settings;"
    echo "  INSERT INTO system_settings (setup_completed, company_name, default_currency)"
    echo "  VALUES (false, 'Asset Management System', 'USD');"
fi
echo ""
