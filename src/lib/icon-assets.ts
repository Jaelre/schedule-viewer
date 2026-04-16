export const ICON_ASSET_VERSION = '4'

export function iconAssetPath(path: string): string {
  return `${path}?v=${ICON_ASSET_VERSION}`
}
