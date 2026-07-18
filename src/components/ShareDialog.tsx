import { Box, Button, Dialog, Divider, Switch, TextField, Typography } from '@mui/material'
import { useCallback, useState, type JSX } from 'react'
import type { Note } from '../data/note'
import { useAuth } from '../context/AuthContext'
import { useShareNote } from '../hooks/useShareNote'
import './ShareDialog.less'

interface ShareDialogProps {
  note: Note | null
  onClose: () => void
}

export default function ShareDialog({ note, onClose }: ShareDialogProps): JSX.Element {
  const { user } = useAuth()
  const { isSharing, shareError, publishNote, unpublishNote, backupNote } = useShareNote()
  const [copied, setCopied] = useState(false)
  const [backedUp, setBackedUp] = useState(false)

  const shareUrl = note ? `${window.location.origin}/share/${note.id}` : ''

  const handleToggle = useCallback(() => {
    if (!note) return
    setCopied(false)
    if (note.isPublic) {
      void unpublishNote(note)
    } else {
      void publishNote(note)
    }
  }, [note, publishNote, unpublishNote])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
  }, [shareUrl])

  const handleBackup = useCallback(async () => {
    if (!note) return
    setBackedUp(false)
    await backupNote(note)
    setBackedUp(true)
  }, [note, backupNote])

  return (
    <Dialog
      open={!!note}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      slotProps={{ paper: { className: 'share-dialog' } }}
    >
      {note && (
        <Box className="share-dialog-content">
          <Typography className="share-dialog-title">Partager « {note.title || 'Sans titre'} »</Typography>

          {!user ? (
            <Typography className="share-dialog-hint">
              Connecte-toi pour sauvegarder cette note en ligne ou la partager publiquement.
            </Typography>
          ) : (
            <>
              <Box className="share-dialog-toggle-row">
                <Box>
                  <Typography className="share-dialog-toggle-label">Sauvegarde privée</Typography>
                  <Typography className="share-dialog-hint">
                    Sauvegarde cette note en ligne pour toi uniquement, pour la retrouver et l'éditer depuis un autre
                    appareil (synchronise-toi là-bas pour la récupérer).
                  </Typography>
                </Box>
                <Button variant="outlined" disabled={isSharing} onClick={() => void handleBackup()}>
                  {backedUp ? 'Sauvegardé !' : 'Sauvegarder en ligne'}
                </Button>
              </Box>

              <Divider />

              <Box className="share-dialog-toggle-row">
                <Box>
                  <Typography className="share-dialog-toggle-label">Partage public</Typography>
                  <Typography className="share-dialog-hint">
                    Toute personne avec le lien peut voir cette note, même sans compte. Elle ne peut ni la modifier
                    ni la supprimer.
                  </Typography>
                </Box>
                <Switch checked={note.isPublic} onChange={handleToggle} disabled={isSharing} />
              </Box>

              {note.isPublic && (
                <Box className="share-dialog-link-row">
                  <TextField
                    variant="outlined"
                    size="small"
                    value={shareUrl}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <Button variant="outlined" onClick={() => void handleCopy()}>
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                </Box>
              )}

              {shareError && <Typography className="share-dialog-error">{shareError}</Typography>}
            </>
          )}

          <Box className="share-dialog-actions">
            <Button variant="contained" onClick={onClose}>
              Fermer
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
