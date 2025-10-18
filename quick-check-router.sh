#!/bin/bash
# Quick check if router exists

echo "Checking Traefik API for assetapp router..."
echo ""

# Raw API output
echo "All routers:"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | .name' 2>/dev/null

echo ""
echo "Searching for 'assetapp':"
curl -s http://localhost:8080/api/http/routers | jq -r '.[] | select(.name | contains("assetapp")) | "FOUND: \(.name) - \(.rule)"' 2>/dev/null || echo "NOT FOUND"

echo ""
echo "Last 20 Traefik log lines:"
docker logs asset-traefik --tail 20 2>&1
