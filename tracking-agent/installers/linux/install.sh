#!/bin/bash

# Asset Management Device Tracking Agent - Linux Installer
# This script installs the device tracking agent as a systemd service

set -e

# Default values
INSTALL_PATH="/opt/assetmgt-tracking"
SERVICE_NAME="assetmgt-tracking"
ENABLE_LOCATION="false"
HEARTBEAT_INTERVAL="300000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Asset Management Device Tracking Agent${NC}"
    echo -e "${CYAN}Linux Installation Script${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}  ℹ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --server-url)
                SERVER_URL="$2"
                shift 2
                ;;
            --tracking-token)
                TRACKING_TOKEN="$2"
                shift 2
                ;;
            --install-path)
                INSTALL_PATH="$2"
                shift 2
                ;;
            --enable-location)
                ENABLE_LOCATION="true"
                shift
                ;;
            --heartbeat-interval)
                HEARTBEAT_INTERVAL="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 --server-url <URL> --tracking-token <TOKEN> [OPTIONS]"
                echo ""
                echo "Required arguments:"
                echo "  --server-url <URL>           Server URL (e.g., https://assetmgt.digile.com)"
                echo "  --tracking-token <TOKEN>     Tracking token from admin panel"
                echo ""
                echo "Optional arguments:"
                echo "  --install-path <PATH>        Installation directory (default: /opt/assetmgt-tracking)"
                echo "  --enable-location            Enable location tracking (default: disabled)"
                echo "  --heartbeat-interval <MS>    Heartbeat interval in milliseconds (default: 300000)"
                echo "  -h, --help                   Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [ -z "$SERVER_URL" ] || [ -z "$TRACKING_TOKEN" ]; then
        print_error "Missing required arguments"
        echo "Use --help for usage information"
        exit 1
    fi
}

# Check Node.js installation
check_node() {
    print_step "[1/7] Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js not found"
        echo ""
        print_info "Please install Node.js and try again:"
        echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "  RHEL/CentOS:   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && sudo yum install -y nodejs"
        echo "  Or visit: https://nodejs.org/"
        exit 1
    fi
}

# Create installation directory
create_directory() {
    print_step "[2/7] Creating installation directory..."
    mkdir -p "$INSTALL_PATH"
    print_success "Created $INSTALL_PATH"
}

# Copy agent files
copy_files() {
    print_step "[3/7] Copying agent files..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    AGENT_SOURCE="$SCRIPT_DIR/../.."
    
    cp "$AGENT_SOURCE/agent.js" "$INSTALL_PATH/"
    cp "$AGENT_SOURCE/package.json" "$INSTALL_PATH/"
    print_success "Agent files copied"
}

# Install dependencies
install_deps() {
    print_step "[4/7] Installing dependencies..."
    cd "$INSTALL_PATH"
    npm install --production --silent
    print_success "Dependencies installed"
}

# Create configuration
create_config() {
    print_step "[5/7] Creating configuration..."
    cat > "$INSTALL_PATH/.env" <<EOF
SERVER_URL=$SERVER_URL
TRACKING_TOKEN=$TRACKING_TOKEN
HEARTBEAT_INTERVAL=$HEARTBEAT_INTERVAL
ENABLE_LOCATION=$ENABLE_LOCATION
EOF
    chmod 600 "$INSTALL_PATH/.env"
    print_success "Configuration saved to $INSTALL_PATH/.env"
}

# Create systemd service
create_service() {
    print_step "[6/7] Creating systemd service..."
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Asset Management Device Tracking Agent
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_PATH
ExecStart=/usr/bin/node $INSTALL_PATH/agent.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=assetmgt-tracking

[Install]
WantedBy=multi-user.target
EOF
    print_success "Systemd service created"
}

# Start service
start_service() {
    print_step "[7/7] Starting service..."
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl restart "$SERVICE_NAME"
    sleep 2
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_success "Service started successfully"
    else
        print_error "Service failed to start"
        echo ""
        echo "Check logs with: journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

# Print completion message
print_completion() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "The device tracking agent is now running and will:"
    echo "  • Monitor system resources (CPU, memory, disk)"
    echo "  • Send heartbeat every $((HEARTBEAT_INTERVAL/60000)) minutes"
    if [ "$ENABLE_LOCATION" = "true" ]; then
        echo "  • Track device location using IP geolocation"
    fi
    echo ""
    echo "Service management commands:"
    echo "  Status:   systemctl status $SERVICE_NAME"
    echo "  Stop:     systemctl stop $SERVICE_NAME"
    echo "  Start:    systemctl start $SERVICE_NAME"
    echo "  Restart:  systemctl restart $SERVICE_NAME"
    echo "  Logs:     journalctl -u $SERVICE_NAME -f"
    echo ""
    echo "Configuration file: $INSTALL_PATH/.env"
    echo "Installation path:  $INSTALL_PATH"
    echo ""
    echo "To uninstall:"
    echo "  systemctl stop $SERVICE_NAME"
    echo "  systemctl disable $SERVICE_NAME"
    echo "  rm /etc/systemd/system/${SERVICE_NAME}.service"
    echo "  rm -rf $INSTALL_PATH"
    echo "  systemctl daemon-reload"
    echo ""
}

# Main installation flow
main() {
    print_header
    check_root
    parse_args "$@"
    check_node
    create_directory
    copy_files
    install_deps
    create_config
    create_service
    start_service
    print_completion
}

main "$@"
