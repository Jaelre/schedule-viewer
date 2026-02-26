#!/bin/bash
# Script to upload config files to Cloudflare R2 bucket
# Usage: ./scripts/upload-config-to-r2.sh [--preview] [--local]
#
# By default, uploads to REMOTE Cloudflare R2 (production).
# Use --preview to upload to preview bucket
# Use --local to upload to local R2 (for development only)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments - default to REMOTE
BUCKET_NAME="schedule-viewer-config"
USE_REMOTE=true

for arg in "$@"; do
  case $arg in
    --preview)
      BUCKET_NAME="schedule-viewer-config-preview"
      ;;
    --local)
      USE_REMOTE=false
      ;;
  esac
done

# Build wrangler flags
WRANGLER_FLAGS=""
if [ "$USE_REMOTE" = true ]; then
  WRANGLER_FLAGS="--remote"
fi

# Display bucket selection
echo ""
if [ "$BUCKET_NAME" == "schedule-viewer-config-preview" ]; then
  echo -e "${YELLOW}📦 Target bucket: ${BUCKET_NAME}${NC}"
else
  echo -e "${GREEN}📦 Target bucket: ${BUCKET_NAME}${NC}"
fi

# Display location
if [ "$USE_REMOTE" = true ]; then
  echo -e "${BLUE}☁️  Location: REMOTE Cloudflare R2${NC}"
else
  echo -e "${YELLOW}💻 Location: LOCAL R2 (development only)${NC}"
fi

# Config files to upload
CONFIG_DIR="src/config"
FILES=(
  "shift-display.config.json"
  "shift-styling.config.json"
  "shift-colors.json"
  "doctor-names.json"
  "full-name-overrides.json"
  "doctor-photos.json"
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
echo -e "${GREEN}✅ All config files uploaded successfully!${NC}"

# Upload doctor photos (PNG/JPG files from public/doctor-photos/)
PHOTOS_DIR="public/doctor-photos"
PHOTO_COUNT=0

shopt -s nullglob
PHOTO_FILES=("${PHOTOS_DIR}"/*.png "${PHOTOS_DIR}"/*.jpg "${PHOTOS_DIR}"/*.jpeg "${PHOTOS_DIR}"/*.webp)
shopt -u nullglob

if [ ${#PHOTO_FILES[@]} -gt 0 ]; then
  echo ""
  echo "Uploading doctor photos to R2..."
  echo ""

  for photo_path in "${PHOTO_FILES[@]}"; do
    filename="$(basename "${photo_path}")"
    ext="${filename##*.}"
    case "$ext" in
      jpg|jpeg) content_type="image/jpeg" ;;
      webp)     content_type="image/webp" ;;
      *)        content_type="image/png" ;;
    esac

    echo -e "Uploading ${YELLOW}${filename}${NC}..."
    npx wrangler r2 object put "${BUCKET_NAME}/doctor-photos/${filename}" --file="${photo_path}" --content-type="${content_type}" ${WRANGLER_FLAGS}

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓${NC} ${filename} uploaded successfully"
      PHOTO_COUNT=$((PHOTO_COUNT + 1))
    else
      echo -e "${RED}✗${NC} Failed to upload ${filename}"
      exit 1
    fi
  done

  echo ""
  echo -e "${GREEN}✅ ${PHOTO_COUNT} photo(s) uploaded successfully!${NC}"
else
  echo ""
  echo -e "${BLUE}ℹ️  No photos found in ${PHOTOS_DIR}, skipping.${NC}"
fi
