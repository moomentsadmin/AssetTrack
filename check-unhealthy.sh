#!/bin/bash
# Check why container is unhealthy

echo "🔍 Checking Unhealthy Container"
echo "================================"
echo ""

echo "1️⃣ Application Logs (last 50 lines)"
echo "------------------------------------"
docker compose -f docker-compose.production.yml logs app --tail=50
echo ""

echo "2️⃣ Check if files exist in container"
echo "-------------------------------------"
echo "Checking /app/dist/:"
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/ 2>&1
echo ""
echo "Checking /app/dist/public/:"
docker compose -f docker-compose.production.yml exec app ls -la /app/dist/public/ 2>&1
echo ""

echo "3️⃣ Check if Node is running"
echo "----------------------------"
docker compose -f docker-compose.production.yml exec app ps aux 2>&1
echo ""

echo "4️⃣ Test health check manually"
echo "------------------------------"
docker compose -f docker-compose.production.yml exec app wget -qO- http://localhost:5000/api/user 2>&1
echo ""

echo "5️⃣ Check if port 5000 is listening"
echo "-----------------------------------"
docker compose -f docker-compose.production.yml exec app netstat -tuln 2>&1 | grep 5000
echo ""

echo "================================"
echo "Diagnostic Complete"
