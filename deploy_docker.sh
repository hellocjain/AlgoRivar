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

# Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose Plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Generate .env if missing
if [ ! -f .env ]; then
    echo -e "${CYAN}Generating secure production .env configuration...${NC}"
    SEC_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
    PG_PASS=$(python3 -c "import secrets; print(secrets.token_hex(16))" 2>/dev/null || openssl rand -hex 16)
    REDIS_PASS=$(python3 -c "import secrets; print(secrets.token_hex(16))" 2>/dev/null || openssl rand -hex 16)

    cat <<ENV > .env
FLASK_ENV=production
HOST=0.0.0.0
PORT=5001
SECRET_KEY=${SEC_KEY}
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
