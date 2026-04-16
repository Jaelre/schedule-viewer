# Sensitive Files Setup

This repository no longer uses `public/config`. Runtime configuration lives in
`src/config/` and is uploaded to R2 by `scripts/upload-config-to-r2.sh`.

Most sensitive local files are tracked in git and encrypted via `git-crypt`.
See [GIT_CRYPT_SETUP.md](GIT_CRYPT_SETUP.md) for unlock/setup instructions.

## Runtime Config Source Files

These files are the source of truth for runtime configuration:

- `src/config/doctor-names.json`
- `src/config/shift-colors.json`
- `src/config/shift-display.config.json`
- `src/config/shift-styling.config.json`
- `src/config/full-name-overrides.json`

The files above are covered by `.gitattributes` and encrypted with `git-crypt`
before they are committed.

### Doctor Photos

- `src/config/doctor-photos.json` maps doctor API IDs to filenames under
  `public/doctor-photos/`.
- The JSON mapping is uploaded to R2 with the rest of the runtime config.
- The image files themselves are static frontend assets and must be deployed
  with the site.

## Private Documents

Private operational documents live under `docs/private/` and are also covered
by `git-crypt`.

## Updating Sensitive Runtime Data

1. Unlock the repository with `git-crypt`.
2. Edit the relevant files in `src/config/`.
3. Upload the runtime config with:

```bash
./scripts/upload-config-to-r2.sh
```

4. Redeploy the frontend as well if you changed files under `public/`, such as
   `public/doctor-photos/`.

## Notes

- Use exact API IDs/names as keys in `src/config/doctor-names.json`.
- Worker config endpoints validate JSON before serving it.
- Keep separate backups of your decrypted staff roster and other sensitive data.
