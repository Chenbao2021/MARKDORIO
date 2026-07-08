import { Divider, IconButton, ListItemText, ListSubheader, Menu, MenuItem, Switch } from '@mui/material'
import { useCallback, useEffect, useState, type JSX, type MouseEvent } from 'react'
import { FONT_OPTIONS } from '../data/fonts'
import { loadGoogleFont } from '../utils/loadGoogleFont'

interface SettingsMenuProps {
  fontValue: string | null
  onFontChange: (fontId: string | null) => void
  autoSave: boolean
  onAutoSaveChange: (enabled: boolean) => void
}

const SettingsDoodle = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="2.6" stroke="#2d2d2d" strokeWidth="1.5" />
    <path
      d="M9 1.8v2.1M9 14.1v2.1M16.2 9h-2.1M3.9 9H1.8M14.1 3.9l-1.5 1.5M5.4 12.6l-1.5 1.5M14.1 14.1l-1.5-1.5M5.4 5.4L3.9 3.9"
      stroke="#2d2d2d"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export default function SettingsMenu({
  fontValue,
  onFontChange,
  autoSave,
  onAutoSaveChange,
}: SettingsMenuProps): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (anchor) FONT_OPTIONS.forEach((f) => loadGoogleFont(f.googleParam))
  }, [anchor])

  const handleOpen = useCallback((e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget), [])
  const handleClose = useCallback(() => setAnchor(null), [])

  const handleFontSelect = useCallback(
    (id: string | null) => {
      onFontChange(id)
      handleClose()
    },
    [onFontChange, handleClose],
  )

  const handleAutoSaveToggle = useCallback(() => {
    onAutoSaveChange(!autoSave)
  }, [autoSave, onAutoSaveChange])

  return (
    <>
      <IconButton className="auth-controls-settings-btn" aria-label="Réglages" onClick={handleOpen}>
        <SettingsDoodle />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={handleClose}>
        <MenuItem onClick={handleAutoSaveToggle}>
          <ListItemText>Sauvegarde automatique</ListItemText>
          <Switch
            edge="end"
            size="small"
            checked={autoSave}
            onClick={(e) => e.stopPropagation()}
            onChange={handleAutoSaveToggle}
          />
        </MenuItem>
        <Divider />
        <ListSubheader disableSticky>Police d'affichage</ListSubheader>
        <MenuItem
          selected={!fontValue}
          onClick={() => handleFontSelect(null)}
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Par défaut
        </MenuItem>
        {FONT_OPTIONS.map((f) => (
          <MenuItem
            key={f.id}
            selected={fontValue === f.id}
            onClick={() => handleFontSelect(f.id)}
            style={{ fontFamily: f.family }}
          >
            {f.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
