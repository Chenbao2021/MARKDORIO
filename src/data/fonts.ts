export interface FontOption {
  id: string
  label: string
  family: string
  googleParam: string
}

// Toutes des polices Google Fonts gratuites (licence OFL).
export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif", googleParam: 'Inter:wght@400;600;700' },
  { id: 'lora', label: 'Lora', family: "'Lora', serif", googleParam: 'Lora:wght@400;600;700' },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: "'Merriweather', serif",
    googleParam: 'Merriweather:wght@400;700',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    family: "'Playfair Display', serif",
    googleParam: 'Playfair+Display:wght@500;700',
  },
  {
    id: 'roboto-mono',
    label: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    googleParam: 'Roboto+Mono:wght@400;600',
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    googleParam: 'JetBrains+Mono:wght@400;600',
  },
  { id: 'patrick-hand', label: 'Patrick Hand', family: "'Patrick Hand', cursive", googleParam: 'Patrick+Hand' },
  {
    id: 'comic-neue',
    label: 'Comic Neue',
    family: "'Comic Neue', cursive",
    googleParam: 'Comic+Neue:wght@400;700',
  },
]

export const FONT_MAP: Record<string, FontOption> = Object.fromEntries(FONT_OPTIONS.map((f) => [f.id, f]))
