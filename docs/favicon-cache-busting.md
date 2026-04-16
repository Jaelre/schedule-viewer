# Favicon cache busting

Favicons and PWA icons use versioned query strings to force browsers to fetch updated assets. The current version is `?v=3`.

## When to bump the version
- When updating any file in `public/icons/`, including `favicon.ico`, PNG sizes, or Apple touch icons.
- When changing the manifest metadata that references icon files.

## How to bump the version
1. Choose the next version number (e.g. move from `?v=3` to `?v=4`).
2. Update `ICON_ASSET_VERSION` in `src/lib/icon-assets.ts`.
3. Deploy the new build; both `src/app/layout.tsx` and `src/app/manifest.ts` will emit the updated icon URLs automatically.

The icon version now has a single source of truth in `src/lib/icon-assets.ts`.
