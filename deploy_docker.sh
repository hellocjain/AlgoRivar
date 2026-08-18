#!/usr/bin/env bash
# ==============================================================================
# AlgoRivar Turnkey 1-Click Docker Cloud Deployment Script
# Tagline: "Algo Trading Made Easy"
# Platform: AC Agarwal (Symphony XTS) Edition
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   🚀 AlgoRivar: Turnkey SaaS Docker Installer        ${NC}"
echo -e "${CYAN}       \"Algo Trading Made Easy\"                      ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Optimize Docker Build Engine
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Check Memory & Auto-Provision Swap for Low-RAM VPS (< 2GB) to Prevent OOM
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ -n "$TOTAL_RAM_MB" ] && [ "$TOTAL_RAM_MB" -lt 2000 ] && [ ! -f /swapfile ]; then
    echo -e "${YELLOW}Low RAM detected (${TOTAL_RAM_MB}MB). Creating 2GB Swap file for smooth operation...${NC}"
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile || true
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}2GB Swap successfully enabled.${NC}"
fi

# Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose Plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Generate .env if missing
if [ ! -f .env ]; then
    echo -e "${CYAN}Generating secure production .env configuration...${NC}"
    SEC_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
    PEPPER=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
    PG_PASS=$(python3 -c "import secrets; print(secrets.token_hex(16))" 2>/dev/null || openssl rand -hex 16)
    REDIS_PASS=$(python3 -c "import secrets; print(secrets.token_hex(16))" 2>/dev/null || openssl rand -hex 16)

    cat <<ENV > .env
FLASK_ENV=production
HOST=0.0.0.0
PORT=5001
SECRET_KEY=${SEC_KEY}
API_KEY_PEPPER=${PEPPER}
POSTGRES_DB=algorivar
POSTGRES_USER=algorivar_user
POSTGRES_PASSWORD=${PG_PASS}
REDIS_PASSWORD=${REDIS_PASS}
DATABASE_URL=postgresql://algorivar_user:${PG_PASS}@algorivar-postgres:5432/algorivar
REDIS_URL=redis://:${REDIS_PASS}@algorivar-redis:6379/0
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENV
    echo -e "${GREEN}Created .env file with generated cryptographic secrets.${NC}"
fi

# Clean any old or renamed containers to prevent name conflicts
docker compose down --remove-orphans 2>/dev/null || true

# Build & Launch Stack
echo -e "${CYAN}Building & Starting AlgoRivar SaaS Container Stack...${NC}"
docker compose up -d --build

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   ✅ AlgoRivar SaaS Stack Successfully Deployed!     ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "${CYAN}Web Portal:           http://localhost:5001 / http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')${NC}"
echo -e "${CYAN}Master Desk Hub:      http://localhost:5001/copytrading${NC}"
echo -e "${CYAN}Retail Client Portal: http://localhost:5001/portal${NC}"
echo -e "${CYAN}Database:             PostgreSQL 16 (Port 5432)${NC}"
echo -e "${CYAN}Cache & Pub/Sub:      Redis 7 (Port 6379)${NC}"
echo -e "${GREEN}======================================================${NC}"
