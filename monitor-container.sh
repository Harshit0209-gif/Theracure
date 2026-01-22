#!/bin/bash
# Container Security Monitor
# Monitors Docker container for suspicious activity

CONTAINER_NAME="${1:-physio-dashboard-secure}"
CHECK_INTERVAL=10  # seconds
CPU_THRESHOLD=80   # Alert if CPU > 80%
MEMORY_THRESHOLD=80 # Alert if memory > 80%

echo "🔍 Container Security Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Container: $CONTAINER_NAME"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "CPU threshold: ${CPU_THRESHOLD}%"
echo "Memory threshold: ${MEMORY_THRESHOLD}%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Create log directory
LOG_DIR="security-logs/$(date +%Y%m%d)"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/monitor-$(date +%H%M%S).log"

log_message() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_message "INFO" "Monitoring started for container: $CONTAINER_NAME"

# Check if container exists
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_message "ERROR" "Container '$CONTAINER_NAME' not found or not running"
    exit 1
fi

# Baseline process count
BASELINE_PROCS=$(docker exec "$CONTAINER_NAME" ps aux 2>/dev/null | wc -l)
log_message "INFO" "Baseline process count: $BASELINE_PROCS"

# Monitor loop
iteration=0
while true; do
    iteration=$((iteration + 1))

    # Get container stats
    stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemPerc}},{{.PIDs}}" "$CONTAINER_NAME" 2>/dev/null)

    if [ -z "$stats" ]; then
        log_message "ERROR" "Container stopped or unreachable"
        exit 1
    fi

    cpu=$(echo "$stats" | cut -d',' -f1 | sed 's/%//')
    memory=$(echo "$stats" | cut -d',' -f2 | sed 's/%//')
    pids=$(echo "$stats" | cut -d',' -f3)

    # Remove decimal part for comparison
    cpu_int=${cpu%.*}
    memory_int=${memory%.*}

    # Display stats
    printf "\r[%s] CPU: %5s%% | Memory: %5s%% | PIDs: %3s" \
        "$(date '+%H:%M:%S')" "$cpu" "$memory" "$pids"

    # Check for suspicious activity
    alert=false

    # Check CPU usage
    if [ "$cpu_int" -gt "$CPU_THRESHOLD" ]; then
        echo ""
        log_message "ALERT" "High CPU usage: ${cpu}%"
        alert=true
    fi

    # Check memory usage
    if [ "$memory_int" -gt "$MEMORY_THRESHOLD" ]; then
        echo ""
        log_message "ALERT" "High memory usage: ${memory}%"
        alert=true
    fi

    # Check process count every 10 iterations
    if [ $((iteration % 10)) -eq 0 ]; then
        current_procs=$(docker exec "$CONTAINER_NAME" ps aux 2>/dev/null | wc -l)
        proc_diff=$((current_procs - BASELINE_PROCS))

        if [ "$proc_diff" -gt 3 ]; then
            echo ""
            log_message "ALERT" "Process count increased by $proc_diff (baseline: $BASELINE_PROCS, current: $current_procs)"

            # Capture process details
            echo ""
            log_message "INFO" "Capturing process details..."
            docker exec "$CONTAINER_NAME" ps aux > "$LOG_DIR/processes-alert-$(date +%H%M%S).txt"

            # Look for suspicious processes
            suspicious=$(docker exec "$CONTAINER_NAME" ps aux | grep -vE 'node|npm|pnpm|chromium|ps aux|PID' | grep -v 'grep')
            if [ ! -z "$suspicious" ]; then
                echo ""
                log_message "CRITICAL" "Suspicious processes detected:"
                echo "$suspicious" | tee -a "$LOG_FILE"

                # Save network connections
                docker exec "$CONTAINER_NAME" netstat -tuln > "$LOG_DIR/network-alert-$(date +%H%M%S).txt" 2>/dev/null || true
            fi

            alert=true
        fi
    fi

    # Check for specific suspicious process names
    if docker exec "$CONTAINER_NAME" ps aux 2>/dev/null | grep -qE 'uEb782bv|xmrig|cryptonight|minerd|ccminer'; then
        echo ""
        log_message "CRITICAL" "Known malicious process detected!"
        docker exec "$CONTAINER_NAME" ps aux > "$LOG_DIR/MALWARE-DETECTED-$(date +%H%M%S).txt"

        echo ""
        echo "🚨🚨🚨 MALWARE DETECTED 🚨🚨🚨"
        echo "Evidence saved to: $LOG_DIR/MALWARE-DETECTED-$(date +%H%M%S).txt"
        echo ""
        echo "IMMEDIATE ACTIONS REQUIRED:"
        echo "1. Stop this container: docker stop $CONTAINER_NAME"
        echo "2. Review the evidence files"
        echo "3. Run cleanup-and-rebuild.sh"
        echo "4. Check your host system for infection"
        echo ""

        break
    fi

    # Log periodic snapshots
    if [ $((iteration % 60)) -eq 0 ]; then
        docker exec "$CONTAINER_NAME" ps aux > "$LOG_DIR/snapshot-$(date +%H%M%S).txt" 2>/dev/null
        log_message "INFO" "Snapshot saved (iteration: $iteration)"
    fi

    sleep "$CHECK_INTERVAL"
done

log_message "INFO" "Monitoring stopped"
echo ""
echo "Logs saved to: $LOG_FILE"

# 1. Make schema changes in prisma/schema.prisma

#   # 2. Create migration (creates the SQL file in prisma/migrations/)
#   npx prisma migrate dev --create-only --name descriptive_name

#   # 3. Review the generated SQL in prisma/migrations/[timestamp]_descriptive_name/migration.sql

#   # 4. Apply to production
#   npx prisma migrate deploy

#   # 5. Generate Prisma Client
#   npx prisma generate
