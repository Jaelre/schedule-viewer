# Configuration Management Scripts

This directory contains utility scripts for managing the Schedule Viewer application.

## R2 Configuration Upload

### `upload-config-to-r2.sh`

Uploads configuration files from `src/config/` to Cloudflare R2 storage.

**Usage:**

```bash
# Upload to production bucket
./scripts/upload-config-to-r2.sh

# Upload to preview bucket (for testing)
./scripts/upload-config-to-r2.sh --preview
```

**Prerequisites:**

1. Install Wrangler CLI: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Create R2 buckets:
   ```bash
   wrangler r2 bucket create schedule-viewer-config
   wrangler r2 bucket create schedule-viewer-config-preview
   ```

**Config Files Uploaded:**

- `shift-display.config.json` - Shift code aliases and label overrides
- `shift-styling.config.json` - Conditional shift styling rules

**Verification:**

After upload, verify the files are in R2:

```bash
# List all files in production bucket
wrangler r2 object list schedule-viewer-config

# Download and view a specific config
wrangler r2 object get schedule-viewer-config/shift-display.config.json
```

**Config Cache:**

The Worker caches config files for 5 minutes (300 seconds) by default. This is configured via `CONFIG_CACHE_TTL_SECONDS` in `worker/wrangler.toml`.

To force a config refresh after upload, you can either:
1. Wait 5 minutes for the cache to expire
2. Restart the Worker (triggers cache clear)
3. Update the config with a different value to bust the cache

## Config File Formats

### shift-display.config.json

Normalizes shift codes and provides label overrides:

```json
{
  "aliases": {
    "night": "N",
    "nights": "N",
    "day shift": "D"
  },
  "labels": {
    "N": "Night Shift",
    "D": "Day Shift",
    "RATP": "Reperibilità ATP"
  }
}
```

### shift-styling.config.json

Configures conditional visual styling for shifts:

```json
{
  "conditionalUnderline": {
    "shiftCode": "RATP",
    "weekdays": [1, 3, 5],
    "weekdaysComment": "0=Sunday, 1=Monday, etc."
  }
}
```

The `conditionalUnderline` feature applies an overline decoration to shifts matching the `shiftCode` on specified `weekdays` (0=Sunday through 6=Saturday).
