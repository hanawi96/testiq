#!/bin/bash

# 🚀 SETUP CRON JOB FOR SCHEDULED PUBLISHING
# Đơn giản, tự động, an toàn

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Scheduled Publishing Cron Job...${NC}"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_SCRIPT="$PROJECT_DIR/scripts/scheduled-publishing-cron.js"

echo -e "${YELLOW}📁 Project directory: $PROJECT_DIR${NC}"
echo -e "${YELLOW}📄 Cron script: $CRON_SCRIPT${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_PATH=$(which node)
echo -e "${GREEN}✅ Node.js found at: $NODE_PATH${NC}"

# Make cron script executable
chmod +x "$CRON_SCRIPT"
echo -e "${GREEN}✅ Made cron script executable${NC}"

# Create cron job entry
CRON_ENTRY="* * * * * $NODE_PATH $CRON_SCRIPT >> /var/log/scheduled-publishing.log 2>&1"

echo -e "${YELLOW}📋 Cron job entry:${NC}"
echo "$CRON_ENTRY"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-publishing-cron.js"; then
    echo -e "${YELLOW}⚠️ Cron job already exists. Removing old entry...${NC}"
    crontab -l 2>/dev/null | grep -v "scheduled-publishing-cron.js" | crontab -
fi

# Add new cron job
echo -e "${BLUE}📝 Adding cron job...${NC}"
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

# Verify cron job was added
if crontab -l 2>/dev/null | grep -q "scheduled-publishing-cron.js"; then
    echo -e "${GREEN}✅ Cron job added successfully!${NC}"
else
    echo -e "${RED}❌ Failed to add cron job${NC}"
    exit 1
fi

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/scheduled-publishing.log
sudo chmod 666 /var/log/scheduled-publishing.log
echo -e "${GREEN}✅ Log file created: /var/log/scheduled-publishing.log${NC}"

# Show current crontab
echo -e "${BLUE}📋 Current crontab:${NC}"
crontab -l

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${YELLOW}📊 The cron job will run every minute and process scheduled articles.${NC}"
echo -e "${YELLOW}📝 Logs will be written to: /var/log/scheduled-publishing.log${NC}"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "  View logs: ${YELLOW}tail -f /var/log/scheduled-publishing.log${NC}"
echo -e "  Remove cron: ${YELLOW}crontab -l | grep -v scheduled-publishing-cron.js | crontab -${NC}"
echo -e "  Test script: ${YELLOW}node $CRON_SCRIPT${NC}"
echo ""
