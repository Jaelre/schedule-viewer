# Project Memory

## Doctor Photos Feature (implemented 2026-02-26)
- Config: `src/config/doctor-photos.json` — maps doctor API IDs → PNG filenames
- Photos served from: `public/doctor-photos/`
- R2 endpoint: `GET /api/config/doctor-photos`
- Frontend: `DoctorPhotosConfig` in `src/lib/config/types.ts`, loaded in `runtime-config.tsx`
- `PersonWithDisplay.photoUrl` holds `/doctor-photos/<filename>` or `null`
- `PHOTO_ICON_WIDTH = 28` added to `types.ts` for column width calculation
- Photo thumbnail (20×20, rounded-full) appears in full-name view (non-scrolled) only
- Click thumbnail → `PhotoModal` (portal, full-size, Escape/click-backdrop to close)
- Worker: `CONFIG_DOCTOR_PHOTOS` constant + `"doctor-photos"` match in `handle_get_config`
- Upload script: `scripts/upload-config-to-r2.sh` includes `doctor-photos.json`

## Architecture Notes
- R2 config pattern: add constant → add match case → upload script → frontend sanitize fn + Promise.allSettled → context value
- `preparePeopleWithNames` accepts optional `doctorPhotos?: Record<string, string>`
