# Favicon cache busting

Favicons and PWA icons use versioned query strings to force browsers to fetch updated assets. The current version is `?v=2`.

## When to bump the version
- When updating any file in `public/icons/`, including `favicon.ico`, PNG sizes, or Apple touch icons.
- When changing the manifest metadata that references icon files.

## How to bump the version
1. Choose the next version number (e.g. move from `?v=2` to `?v=3`).
2. Update icon URLs in `src/app/layout.tsx` under `metadata.icons` so each entry ends with the new query string.
3. Update the `src` values in `public/icons/site.webmanifest` to match the same version.
4. Deploy the new build; browsers will fetch the new URLs and refresh cached favicons.

Keep the version strings in both files in sync so all platforms pick up the same icon revision.
