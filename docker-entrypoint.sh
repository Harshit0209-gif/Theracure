#!/bin/sh
set -e

echo "🚀 Starting Theracure Dashboard..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to handle shutdown gracefully
shutdown() {
  echo ""
  echo "🛑 Shutting down gracefully..."

  # Kill SMS worker if running
  if [ ! -z "$WORKER_PID" ]; then
    echo "📱 Stopping SMS worker (PID: $WORKER_PID)..."
    kill -TERM "$WORKER_PID" 2>/dev/null || true
    wait "$WORKER_PID" 2>/dev/null || true
  fi

  # Kill Next.js app if running
  if [ ! -z "$APP_PID" ]; then
    echo "🌐 Stopping Next.js app (PID: $APP_PID)..."
    kill -TERM "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi

  echo "✅ Shutdown complete"
  exit 0
}

# Trap SIGTERM and SIGINT for graceful shutdown
trap shutdown TERM INT

# Start SMS worker in background
echo "📱 Starting SMS worker..."
node /app/workers/sms-worker.js &
WORKER_PID=$!
echo "   Worker PID: $WORKER_PID"

# Small delay to let worker initialize
sleep 2

# Check if worker is still running
if ! kill -0 $WORKER_PID 2>/dev/null; then
  echo "❌ SMS worker failed to start"
  exit 1
fi

echo "✅ SMS worker started successfully"
echo ""

# Start Next.js app in background (so we can wait for both processes)
echo "🌐 Starting Next.js application..."
node server.js &
APP_PID=$!
echo "   App PID: $APP_PID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services started"
echo "   - Dashboard: http://localhost:3001"
echo "   - SMS Worker: Running (checks queue every 5s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for both processes
# This keeps the container running and allows for graceful shutdown
wait $APP_PID $WORKER_PID

# If we reach here, one of the processes exited
echo "⚠️  A process has exited unexpectedly"
shutdown
