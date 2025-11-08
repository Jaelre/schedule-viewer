#!/bin/bash
# Script to upload config files to Cloudflare R2 bucket
# Usage: ./scripts/upload-config-to-r2.sh [--preview]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine bucket name based on flag
BUCKET_NAME="schedule-viewer-config"
if [ "$1" == "--preview" ]; then
  BUCKET_NAME="schedule-viewer-config-preview"
  echo -e "${YELLOW}Using PREVIEW bucket: ${BUCKET_NAME}${NC}"
else
  echo -e "${GREEN}Using PRODUCTION bucket: ${BUCKET_NAME}${NC}"
fi

# Config files to upload
CONFIG_DIR="src/config"
FILES=(
  "shift-display.config.json"
  "shift-styling.config.json"
)

echo ""
echo "Uploading config files to R2..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI not found. Install it with: npm install -g wrangler${NC}"
    exit 1
fi

# Upload each config file
for file in "${FILES[@]}"; do
  FILE_PATH="${CONFIG_DIR}/${file}"

  if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Warning: ${FILE_PATH} not found, skipping...${NC}"
    continue
  fi

  echo -e "Uploading ${YELLOW}${file}${NC}..."

  # Upload to R2 using wrangler
  wrangler r2 object put "${BUCKET_NAME}/${file}" --file="${FILE_PATH}" --content-type="application/json"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} ${file} uploaded successfully"
  else
    echo -e "${RED}✗${NC} Failed to upload ${file}"
    exit 1
  fi
done

echo ""
echo -e "${GREEN}All config files uploaded successfully!${NC}"
echo ""
echo "To verify, run:"
echo "  wrangler r2 object get ${BUCKET_NAME}/shift-display.config.json"
echo "  wrangler r2 object get ${BUCKET_NAME}/shift-styling.config.json"
