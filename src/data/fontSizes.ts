export interface FontSizeOption {
  id: string
  label: string
  px: number
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { id: 'small', label: 'Petit', px: 14 },
  { id: 'medium', label: 'Normal', px: 16 },
  { id: 'large', label: 'Grand', px: 18 },
  { id: 'xlarge', label: 'Très grand', px: 20 },
]

export const DEFAULT_FONT_SIZE_ID = 'medium'
export const CONTENT_FONT_SIZE_KEY = 'markdorio.contentFontSize'

export const FONT_SIZE_MAP: Record<string, FontSizeOption> = Object.fromEntries(
  FONT_SIZE_OPTIONS.map((f) => [f.id, f]),
)
