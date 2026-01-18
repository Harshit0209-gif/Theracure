#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Testing Docker Build & SMS Worker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with required environment variables"
    exit 1
fi

# Stop and remove existing container
echo -e "${YELLOW}🧹 Cleaning up existing containers...${NC}"
docker stop dashboard-test 2>/dev/null || true
docker rm dashboard-test 2>/dev/null || true

# Build the Docker image
echo ""
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t theracure-dashboard:test .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Run the container
echo -e "${BLUE}🚀 Starting container...${NC}"
docker run -d \
  --name dashboard-test \
  --env-file .env \
  -p 3002:3001 \
  theracure-dashboard:test

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

# Wait for container to be healthy
echo ""
echo -e "${YELLOW}⏳ Waiting for services to start (15 seconds)...${NC}"
sleep 15

# Check container status
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
docker ps | grep dashboard-test

# Check logs for both services
echo ""
echo -e "${BLUE}📜 Recent logs:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker logs dashboard-test --tail 30

# Check if both processes are running
echo ""
echo -e "${BLUE}🔍 Checking running processes in container:${NC}"
docker exec dashboard-test ps aux | grep -E 'node|PID' | grep -v grep

# Check if SMS worker is running
echo ""
if docker logs dashboard-test 2>&1 | grep -q "SMS Worker started"; then
    echo -e "${GREEN}✅ SMS Worker is running${NC}"
else
    echo -e "${RED}❌ SMS Worker not detected${NC}"
fi

# Check if Next.js app is running
if docker logs dashboard-test 2>&1 | grep -q "Next.js"; then
    echo -e "${GREEN}✅ Next.js app is running${NC}"
else
    echo -e "${RED}❌ Next.js app not detected${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Test container is running on http://localhost:3002${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Useful commands:"
echo "  - View logs:        docker logs -f dashboard-test"
echo "  - View processes:   docker exec dashboard-test ps aux"
echo "  - Stop container:   docker stop dashboard-test"
echo "  - Remove container: docker rm dashboard-test"
echo ""
