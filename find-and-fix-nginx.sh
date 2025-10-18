#!/bin/bash
# Find and fix Nginx configuration

echo "=========================================="
echo "Find and Fix Nginx Configuration"
echo "=========================================="
echo ""

echo "1. Searching for Nginx config files..."
echo "----------------------------------------"

# Check common locations
POSSIBLE_CONFIGS=(
    "/etc/nginx/sites-available/asset-management"
    "/etc/nginx/sites-available/assetmgt"
    "/etc/nginx/sites-available/assetmgt.digile.com"
    "/etc/nginx/sites-available/default"
    "/etc/nginx/conf.d/asset-management.conf"
    "/etc/nginx/conf.d/assetmgt.conf"
)

FOUND_CONFIG=""

for config in "${POSSIBLE_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ Found: $config"
        FOUND_CONFIG="$config"
        break
    else
        echo "❌ Not found: $config"
    fi
done

if [ -z "$FOUND_CONFIG" ]; then
    echo ""
    echo "Searching all Nginx configs for 'assetmgt.digile.com'..."
    FOUND_CONFIG=$(grep -r "assetmgt.digile.com" /etc/nginx/ 2>/dev/null | grep -v ".backup" | head -1 | cut -d: -f1)
    
    if [ -n "$FOUND_CONFIG" ]; then
        echo "✅ Found config with assetmgt.digile.com: $FOUND_CONFIG"
    fi
fi

if [ -z "$FOUND_CONFIG" ]; then
    echo ""
    echo "❌ Could not find Nginx config for assetmgt.digile.com"
    echo ""
    echo "Listing all Nginx site configs:"
    ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "No sites-available directory"
    echo ""
    ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "No conf.d directory"
    echo ""
    echo "Please create Nginx config or check your setup"
    exit 1
fi

echo ""
echo "2. Current configuration:"
echo "----------------------------------------"
cat "$FOUND_CONFIG"
echo ""

echo "3. Checking for SSL certificates..."
echo "----------------------------------------"
if [ -f "/etc/letsencrypt/live/assetmgt.digile.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found"
    HAS_SSL=true
else
    echo "⚠️  SSL certificate not found"
    echo "Will create HTTP-only config"
    HAS_SSL=false
fi

echo ""
echo "4. Creating backup..."
sudo cp "$FOUND_CONFIG" "$FOUND_CONFIG.backup.$(date +%s)"
echo "✅ Backup created"
echo ""

echo "5. Updating configuration with increased timeouts..."

if [ "$HAS_SSL" = true ]; then
    # HTTPS configuration
    sudo tee "$FOUND_CONFIG" > /dev/null <<'EOF'
server {
    listen 80;
    server_name assetmgt.digile.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name assetmgt.digile.com;

    ssl_certificate /etc/letsencrypt/live/assetmgt.digile.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assetmgt.digile.com/privkey.pem;

    # Increased timeouts to prevent 504 errors
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
else
    # HTTP only configuration
    sudo tee "$FOUND_CONFIG" > /dev/null <<'EOF'
server {
    listen 80;
    server_name assetmgt.digile.com;

    # Increased timeouts to prevent 504 errors
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
fi

echo "✅ Configuration updated"
echo ""

echo "6. Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "7. Reloading Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        echo ""
        echo "=========================================="
        echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
        echo "=========================================="
        echo ""
        echo "Configuration file: $FOUND_CONFIG"
        echo "Timeout increased to 300 seconds (5 minutes)"
        echo ""
        if [ "$HAS_SSL" = true ]; then
            echo "🌐 Now try: https://assetmgt.digile.com"
        else
            echo "🌐 Now try: http://assetmgt.digile.com"
        fi
        echo ""
        echo "Note: If you still get 504, run this to check logs:"
        echo "  ./show-pm2-errors.sh"
    else
        echo "❌ Failed to reload Nginx"
        echo "Restoring backup..."
        sudo cp "$FOUND_CONFIG.backup."* "$FOUND_CONFIG"
    fi
else
    echo ""
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    sudo cp "$FOUND_CONFIG.backup."* "$FOUND_CONFIG"
    exit 1
fi
