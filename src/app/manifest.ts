import type { MetadataRoute } from 'next'
import { iconAssetPath } from '@/lib/icon-assets'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Turni PS Policlinico',
    short_name: 'Turni',
    icons: [
      {
        src: iconAssetPath('/icons/android-chrome-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: iconAssetPath('/icons/android-chrome-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  }
}
