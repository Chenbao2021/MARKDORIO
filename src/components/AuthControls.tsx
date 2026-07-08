import { Avatar, Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { useCallback, useState, type JSX, type MouseEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotesSync } from '../hooks/useNotesSync'
import SettingsMenu from './SettingsMenu'
import './AuthControls.less'

const SyncDoodle = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M15 5 A6.5 6.5 0 1 0 16 9"
      stroke="#2d2d2d"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M15 1.5 V5 H11.5" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function formatSyncedTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface AuthControlsProps {
  fontValue: string | null
  onFontChange: (fontId: string | null) => void
  autoSave: boolean
  onAutoSaveChange: (enabled: boolean) => void
}

export default function AuthControls({
  fontValue,
  onFontChange,
  autoSave,
  onAutoSaveChange,
}: AuthControlsProps): JSX.Element {
  const { user, isAuthLoading, signInWithGoogle, signOutUser } = useAuth()
  const { isSyncing, lastSyncedAt, syncError, syncNow } = useNotesSync()
  const [signInError, setSignInError] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const handleSignIn = useCallback(async () => {
    setSignInError(null)
    try {
      await signInWithGoogle()
    } catch {
      setSignInError('Connexion impossible')
    }
  }, [signInWithGoogle])

  const openMenu = useCallback((e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget), [])
  const closeMenu = useCallback(() => setMenuAnchor(null), [])

  const handleSignOut = useCallback(async () => {
    closeMenu()
    await signOutUser()
  }, [closeMenu, signOutUser])

  if (isAuthLoading) {
    return <Box className="auth-controls" />
  }

  if (!user) {
    return (
      <Box className="auth-controls">
        <SettingsMenu
          fontValue={fontValue}
          onFontChange={onFontChange}
          autoSave={autoSave}
          onAutoSaveChange={onAutoSaveChange}
        />
        <Button variant="outlined" onClick={handleSignIn}>
          Se connecter avec Google
        </Button>
        {signInError && <Typography className="auth-controls-error">{signInError}</Typography>}
      </Box>
    )
  }

  const statusText = isSyncing
    ? 'Synchronisation…'
    : syncError
      ? syncError
      : lastSyncedAt
        ? `Synchronisé à ${formatSyncedTime(lastSyncedAt)}`
        : null

  return (
    <Box className="auth-controls">
      {statusText && (
        <Typography className={`auth-controls-status${syncError ? ' is-error' : ''}`}>{statusText}</Typography>
      )}
      <IconButton
        className="auth-controls-sync-btn"
        aria-label="Synchroniser les notes"
        onClick={() => void syncNow()}
        disabled={isSyncing}
      >
        <SyncDoodle />
      </IconButton>
      <SettingsMenu
        fontValue={fontValue}
        onFontChange={onFontChange}
        autoSave={autoSave}
        onAutoSaveChange={onAutoSaveChange}
      />
      <IconButton className="auth-controls-avatar-btn" onClick={openMenu} aria-label="Compte">
        <Avatar
          className="auth-controls-avatar"
          src={user.photoURL ?? undefined}
          alt={user.displayName ?? user.email ?? 'Utilisateur'}
        >
          {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={handleSignOut}>Se déconnecter</MenuItem>
      </Menu>
    </Box>
  )
}
