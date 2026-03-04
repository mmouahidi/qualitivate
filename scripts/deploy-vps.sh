#!/bin/bash
# Run this on the VPS after git pull to rebuild and restart the app.
# Usage: ./scripts/deploy-vps.sh   (from repo root)

set -e
cd "$(dirname "$0")/.."
echo "Pulling latest..."
git pull origin master
echo "Installing dependencies..."
npm install
echo "Building server (required for API changes)..."
npm run build:server
echo "Building client..."
npm run build:client
echo "Restarting app (PM2)..."
pm2 restart all
echo "Done."
