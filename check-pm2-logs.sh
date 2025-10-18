#!/bin/bash
# Check PM2 logs for errors

echo "=== PM2 Error Logs (Last 50 lines) ==="
pm2 logs asset-management --err --lines 50 --nostream

echo ""
echo "=== PM2 Out Logs (Last 30 lines) ==="
pm2 logs asset-management --out --lines 30 --nostream

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Check Log Files ==="
if [ -d "logs" ]; then
    echo "Error log:"
    tail -n 30 logs/err.log 2>/dev/null || echo "No error log file"
    echo ""
    echo "Out log:"
    tail -n 30 logs/out.log 2>/dev/null || echo "No out log file"
fi
