#!/bin/bash

# 🚀 Quick Deployment Script
# Deploys backend to Render and frontend to Vercel

set -e

echo "🎮 9DTTT Deployment Script"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Commit and push
echo -e "${BLUE}📝 Committing changes...${NC}"
git add .
git commit -m "Deploy: $(date +%Y-%m-%d_%H:%M:%S)" || echo "Nothing to commit"

echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""
echo "Automatic deployments will start:"
echo "  • Render: Building backend..."
echo "  • Vercel: Building frontend..."
echo ""
echo "Monitor deployments:"
echo "  • Render: https://dashboard.render.com"
echo "  • Vercel: https://vercel.com/dashboard"
echo ""
echo -e "${GREEN}🎉 Deployment initiated!${NC}"
