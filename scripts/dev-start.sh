#!/bin/bash
set -e

echo "🚀 SuperBoard Dev Setup - All in One"
echo "===================================="

# Step 1: Docker cleanup
echo "1️⃣  Cleaning Docker..."
docker system prune -af --volumes > /dev/null 2>&1 || true

# Step 2: Infrastructure setup
echo "2️⃣  Starting infrastructure..."
echo "   - Using Docker Compose (includes API/Web by default)"
npm run dev:docker

# Wait for services to be ready
echo "⏳ Waiting for services to start (15s)..."
sleep 15

# Step 3: Setup
echo "3️⃣  Running setup..."
npm run setup

# Step 4: Health check
echo "4️⃣  Running health check..."
npm run health:check

echo ""
echo "✅ SuperBoard is ready!"
echo "===================================="
echo "📊 Services running:"
echo "   - API: http://localhost:4000"
echo "   - Web: http://localhost:3000"
echo "   - Postgres: localhost:5433"
echo "   - Redis: localhost:6379"
echo "===================================="
