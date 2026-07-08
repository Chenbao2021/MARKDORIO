import { Box, Button, Dialog, Switch, TextField, Typography } from '@mui/material'
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
  const { isSharing, shareError, publishNote, unpublishNote } = useShareNote()
  const [copied, setCopied] = useState(false)

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
            <Typography className="share-dialog-hint">Connecte-toi pour partager cette note publiquement.</Typography>
          ) : (
            <>
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
