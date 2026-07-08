const loadedFonts = new Set<string>()

export function loadGoogleFont(googleParam: string): void {
  if (loadedFonts.has(googleParam)) return
  loadedFonts.add(googleParam)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${googleParam}&display=swap`
  document.head.appendChild(link)
}
