#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  Theracure Dashboard — Deploy & Setup Script
# ─────────────────────────────────────────────

APP_DIR="/var/www/theracure/Theracure-Dashboard"
STANDALONE_DIR="$APP_DIR/.next/standalone"
SERVICE_NAME="theracure-dashboard"
SERVICE_FILE="$APP_DIR/theracure-dashboard.service"
APP_USER="fuckhacker"
PUPPETEER_CACHE="/home/$APP_USER/.cache/puppeteer"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
check()   { echo -e "${GREEN}[CHECK]${NC} $1"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Theracure Dashboard — Deploy Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Check app directory ──────────────────────
info "Checking app directory..."
[ -d "$APP_DIR" ] || error "App directory not found: $APP_DIR"
check "App directory exists: $APP_DIR"

cd "$APP_DIR"

# ── 2. Check .next/standalone build ────────────
info "Checking Next.js standalone build..."
[ -d "$STANDALONE_DIR" ] || error ".next/standalone not found. Run 'pnpm build' first."
[ -f "$STANDALONE_DIR/server.js" ] || error "server.js not found in standalone. Build may be incomplete."
check "Standalone build found"

# ── 3. Copy static assets ──────────────────────
info "Copying static assets into standalone..."

if [ -d "$APP_DIR/.next/static" ]; then
  cp -r "$APP_DIR/.next/static" "$STANDALONE_DIR/.next/static"
  check "Copied .next/static → standalone/.next/static"
else
  warn ".next/static not found — skipping"
fi

if [ -d "$APP_DIR/public" ]; then
  cp -r "$APP_DIR/public" "$STANDALONE_DIR/public"
  check "Copied public → standalone/public"
else
  warn "public/ not found — skipping"
fi

# ── 4. Check .env file ─────────────────────────
info "Checking environment file..."
if [ -f "$STANDALONE_DIR/.env" ]; then
  check ".env found in standalone"
elif [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" "$STANDALONE_DIR/.env"
  check "Copied .env to standalone"
else
  warn ".env not found — make sure environment variables are set in the service file"
fi

# ── 5. Puppeteer Chrome check ──────────────────
info "Checking Puppeteer Chrome installation..."

CHROME_BIN=$(find "$PUPPETEER_CACHE" -name "chrome" -type f 2>/dev/null | sort -V | tail -1)

if [ -n "$CHROME_BIN" ]; then
  check "Chrome found: $CHROME_BIN"

  # Update service file with correct path
  if [ -f "$SERVICE_FILE" ]; then
    CURRENT_PATH=$(grep "PUPPETEER_EXECUTABLE_PATH" "$SERVICE_FILE" | cut -d'=' -f2-)
    if [ "$CURRENT_PATH" != "$CHROME_BIN" ]; then
      warn "Service file has outdated Chrome path:"
      warn "  Current : $CURRENT_PATH"
      warn "  Correct : $CHROME_BIN"
      sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=$CHROME_BIN|" "$SERVICE_FILE"
      info "Updated PUPPETEER_EXECUTABLE_PATH in service file"
    else
      check "Service file Chrome path is up to date"
    fi
  fi
else
  warn "Chrome not found in $PUPPETEER_CACHE — installing now..."
  sudo -u "$APP_USER" npx puppeteer browsers install chrome
  CHROME_BIN=$(find "$PUPPETEER_CACHE" -name "chrome" -type f 2>/dev/null | sort -V | tail -1)
  [ -n "$CHROME_BIN" ] || error "Chrome installation failed"
  check "Chrome installed: $CHROME_BIN"

  # Update service file
  if [ -f "$SERVICE_FILE" ]; then
    sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=$CHROME_BIN|" "$SERVICE_FILE"
    info "Updated PUPPETEER_EXECUTABLE_PATH in service file"
  fi
fi

# Ensure chrome is executable
chmod +x "$CHROME_BIN"
chown "$APP_USER:$APP_USER" "$CHROME_BIN" 2>/dev/null || true

# ── 6. Set permissions ─────────────────────────
info "Setting file permissions..."
chown -R "$APP_USER:$APP_USER" "$APP_DIR/.next" 2>/dev/null || true
check "Permissions set"

# ── 7. Install/update systemd service ─────────
info "Setting up systemd service..."
if [ -f "$SERVICE_FILE" ]; then
  cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME.service"
  systemctl daemon-reload
  check "Systemd service installed/updated"
else
  warn "Service file not found at $SERVICE_FILE — skipping systemd setup"
fi

# ── 8. Restart service ─────────────────────────
info "Restarting $SERVICE_NAME service..."
if systemctl is-enabled "$SERVICE_NAME" &>/dev/null; then
  systemctl restart "$SERVICE_NAME"
  sleep 2
  if systemctl is-active "$SERVICE_NAME" &>/dev/null; then
    check "Service is running ✓"
  else
    error "Service failed to start. Run: journalctl -u $SERVICE_NAME -n 50"
  fi
else
  warn "Service not enabled yet. Run:"
  warn "  sudo systemctl enable $SERVICE_NAME"
  warn "  sudo systemctl start $SERVICE_NAME"
fi

# ── 9. Summary ─────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}   Deploy complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App dir     : $APP_DIR"
echo "  Standalone  : $STANDALONE_DIR"
echo "  Chrome      : $CHROME_BIN"
echo "  Service     : $SERVICE_NAME (port 3001)"
echo ""
echo "  Useful commands:"
echo "  journalctl -u $SERVICE_NAME -f       → live logs"
echo "  systemctl status $SERVICE_NAME        → service status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
