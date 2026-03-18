#!/bin/bash
set -e

# ============================================
# YT-API Deploy to Hetzner
# ============================================
# Prerequisites:
#   1. Create a Hetzner Cloud account: https://console.hetzner.cloud
#   2. Install hcloud CLI: brew install hcloud
#   3. Create an API token in Hetzner Console > Security > API Tokens
#   4. Run: hcloud context create yt-api (paste your token)
#
# Usage: ./deploy.sh
# ============================================

SERVER_NAME="yt-api"
SERVER_TYPE="cx22"          # 2 vCPU, 4GB RAM — €4.35/mo
IMAGE="ubuntu-24.04"
LOCATION="nbg1"            # Nuremberg, EU

echo "🔍 Checking hcloud CLI..."
if ! command -v hcloud &> /dev/null; then
    echo "❌ hcloud not installed. Run: brew install hcloud"
    exit 1
fi

# Check if server already exists
if hcloud server describe "$SERVER_NAME" &> /dev/null; then
    echo "⚡ Server '$SERVER_NAME' already exists. Getting IP..."
    SERVER_IP=$(hcloud server ip "$SERVER_NAME")
else
    echo "🚀 Creating server '$SERVER_NAME' ($SERVER_TYPE)..."

    # Create SSH key if needed
    if ! hcloud ssh-key describe yt-api-key &> /dev/null; then
        echo "🔑 Adding SSH key..."
        hcloud ssh-key create --name yt-api-key --public-key-from-file ~/.ssh/id_ed25519.pub 2>/dev/null || \
        hcloud ssh-key create --name yt-api-key --public-key-from-file ~/.ssh/id_rsa.pub
    fi

    hcloud server create \
        --name "$SERVER_NAME" \
        --type "$SERVER_TYPE" \
        --image "$IMAGE" \
        --location "$LOCATION" \
        --ssh-key yt-api-key

    SERVER_IP=$(hcloud server ip "$SERVER_NAME")
    echo "⏳ Waiting for server to boot..."
    sleep 30

    # Install Docker on the server
    echo "📦 Installing Docker..."
    ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" << 'REMOTE'
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
REMOTE
fi

SERVER_IP=$(hcloud server ip "$SERVER_NAME")
echo "📡 Server IP: $SERVER_IP"

# Deploy
echo "📤 Uploading project..."
rsync -avz --exclude node_modules --exclude .git \
    -e "ssh -o StrictHostKeyChecking=no" \
    ./ root@"$SERVER_IP":/opt/yt-api/

echo "🐳 Starting container..."
PROXY_URL_ESCAPED=$(printf '%q' "${PROXY_URL:-}")
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" \
    "cd /opt/yt-api && PROXY_URL=${PROXY_URL_ESCAPED} docker compose down 2>/dev/null || true && PROXY_URL=${PROXY_URL_ESCAPED} docker compose up -d --build && echo '✅ Container running!' && PROXY_URL=${PROXY_URL_ESCAPED} docker compose logs --tail 5"

echo ""
echo "============================================"
echo "✅ DEPLOYED!"
echo "🌐 API: http://$SERVER_IP:3000"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Test: curl http://$SERVER_IP:3000"
echo "  2. Add to RapidAPI (see rapidapi-setup.md)"
