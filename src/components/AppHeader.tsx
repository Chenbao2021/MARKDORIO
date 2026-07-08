import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import type { JSX } from 'react'
import AuthControls from './AuthControls'
import './AppHeader.less'

interface AppHeaderProps {
  onToggleSidebar: () => void
  fontValue: string | null
  onFontChange: (fontId: string | null) => void
  autoSave: boolean
  onAutoSaveChange: (enabled: boolean) => void
}

const MenuDoodle = (): JSX.Element => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
    <path d="M1 2 H21" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M1 8 H21" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M1 14 H21" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export default function AppHeader({
  onToggleSidebar,
  fontValue,
  onFontChange,
  autoSave,
  onAutoSaveChange,
}: AppHeaderProps): JSX.Element {
  return (
    <AppBar position="static" color="transparent" elevation={0} className="app-header">
      <Toolbar className="app-header-toolbar">
        <IconButton
          className="app-header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Afficher les notes"
        >
          <MenuDoodle />
        </IconButton>
        <Typography variant="h6" className="app-header-title">
          Markdorio
        </Typography>
        <AuthControls
          fontValue={fontValue}
          onFontChange={onFontChange}
          autoSave={autoSave}
          onAutoSaveChange={onAutoSaveChange}
        />
      </Toolbar>
    </AppBar>
  )
}
