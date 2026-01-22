#!/bin/bash
# Security Incident Cleanup Script
# WARNING: This will stop all containers and remove all Docker images

set -e

echo "🚨 SECURITY INCIDENT CLEANUP SCRIPT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will:"
echo "  1. Stop all running Docker containers"
echo "  2. Remove all Docker containers and images"
echo "  3. Clean npm/pnpm cache"
echo "  4. Remove node_modules"
echo "  5. Rebuild from scratch with security measures"
echo ""
read -p "⚠️  Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted by user"
    exit 1
fi

echo ""
echo "📸 Step 1: Capturing evidence..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create evidence directory
mkdir -p security-incident-$(date +%Y%m%d-%H%M%S)
EVIDENCE_DIR="security-incident-$(date +%Y%m%d-%H%M%S)"

# Capture running processes from all containers
for container in $(docker ps -q); do
    echo "Capturing process list from container: $container"
    docker exec $container ps aux > "$EVIDENCE_DIR/processes-$container.txt" 2>/dev/null || echo "Failed to capture"
    docker exec $container netstat -tuln > "$EVIDENCE_DIR/network-$container.txt" 2>/dev/null || echo "Failed to capture"
done

# Capture Docker info
docker ps -a > "$EVIDENCE_DIR/docker-ps.txt"
docker images > "$EVIDENCE_DIR/docker-images.txt"

echo "✅ Evidence saved to: $EVIDENCE_DIR"
echo ""

echo "🛑 Step 2: Stopping all containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"
echo "✅ All containers stopped"
echo ""

echo "🗑️  Step 3: Removing containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
echo "✅ All containers removed"
echo ""

echo "🗑️  Step 4: Removing images..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker rmi $(docker images -q) -f 2>/dev/null || echo "No images to remove"
echo "✅ All images removed"
echo ""

echo "🧹 Step 5: Pruning Docker system..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker system prune -a --volumes -f
docker builder prune -a -f
echo "✅ Docker system cleaned"
echo ""

echo "🧹 Step 6: Cleaning node_modules..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf node_modules
echo "✅ node_modules removed"
echo ""

echo "🧹 Step 7: Cleaning package manager caches..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm store prune || echo "pnpm not available"
npm cache clean --force || echo "npm not available"
echo "✅ Caches cleaned"
echo ""

echo "🔍 Step 8: Running security audit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm install --frozen-lockfile
pnpm audit > "$EVIDENCE_DIR/security-audit.txt" 2>&1 || echo "⚠️  Vulnerabilities found - check $EVIDENCE_DIR/security-audit.txt"
echo "✅ Security audit complete"
echo ""

echo "🏗️  Step 9: Rebuilding Docker image..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker build --no-cache --pull -t physio-dashboard:secure .
echo "✅ Image rebuilt"
echo ""

echo "🔒 Step 10: Starting container with security measures..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker run -d \
  --name physio-dashboard-secure \
  --restart unless-stopped \
  --cpus="2" \
  --memory="1g" \
  --memory-swap="1g" \
  --pids-limit=100 \
  --security-opt=no-new-privileges:true \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /app/uploads:rw,noexec,nosuid,size=500m \
  --env-file .env.production \
  -p 3001:3001 \
  physio-dashboard:secure

echo "✅ Container started with security hardening"
echo ""

echo "📊 Step 11: Monitoring for 30 seconds..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 5
docker stats --no-stream physio-dashboard-secure
echo ""

echo "✅ CLEANUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "  1. Review evidence in: $EVIDENCE_DIR"
echo "  2. Monitor container: docker stats physio-dashboard-secure"
echo "  3. Check logs: docker logs -f physio-dashboard-secure"
echo "  4. Verify no suspicious processes: docker exec physio-dashboard-secure ps aux"
echo "  5. Monitor CPU usage for the next 24 hours"
echo "  6. Change all passwords and API keys"
echo "  7. Review SECURITY_INCIDENT_RESPONSE.md for additional steps"
echo ""
echo "⚠️  If the issue persists, consider:"
echo "  - Scanning your host system for malware"
echo "  - Reviewing recent code changes"
echo "  - Checking for compromised credentials"
echo "  - Consulting a security professional"
echo ""
