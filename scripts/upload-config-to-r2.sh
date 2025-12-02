#!/bin/bash
# Script to upload config files to Cloudflare R2 bucket
# Usage: ./scripts/upload-config-to-r2.sh [--preview] [--remote]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
BUCKET_NAME="schedule-viewer-config"
WRANGLER_FLAGS=""

for arg in "$@"; do
  case $arg in
    --preview)
      BUCKET_NAME="schedule-viewer-config-preview"
      ;;
    --remote)
      WRANGLER_FLAGS="--remote"
      ;;
  esac
done

# Display bucket selection
if [ "$BUCKET_NAME" == "schedule-viewer-config-preview" ]; then
  echo -e "${YELLOW}Using PREVIEW bucket: ${BUCKET_NAME}${NC}"
else
  echo -e "${GREEN}Using PRODUCTION bucket: ${BUCKET_NAME}${NC}"
fi

# Display remote flag status
if [ -n "$WRANGLER_FLAGS" ]; then
  echo -e "${YELLOW}Using REMOTE Cloudflare R2 (not local)${NC}"
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


# Upload each config file
for file in "${FILES[@]}"; do
  FILE_PATH="${CONFIG_DIR}/${file}"

  if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Warning: ${FILE_PATH} not found, skipping...${NC}"
    continue
  fi

  echo -e "Uploading ${YELLOW}${file}${NC}..."

  # Upload to R2 using wrangler
  npx wrangler r2 object put "${BUCKET_NAME}/${file}" --file="${FILE_PATH}" --content-type="application/json" ${WRANGLER_FLAGS}

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
if [ -n "$WRANGLER_FLAGS" ]; then
  echo "  npx wrangler r2 object get ${BUCKET_NAME}/shift-display.config.json --remote"
  echo "  npx wrangler r2 object get ${BUCKET_NAME}/shift-styling.config.json --remote"
else
  echo "  npx wrangler r2 object get ${BUCKET_NAME}/shift-display.config.json"
  echo "  npx wrangler r2 object get ${BUCKET_NAME}/shift-styling.config.json"
fi
