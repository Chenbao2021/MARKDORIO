import { Box, Button, Dialog, Typography } from '@mui/material'
import type { JSX } from 'react'
import type { Note } from '../data/note'
import './DeleteNoteDialog.less'

interface DeleteNoteDialogProps {
  note: Note | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteNoteDialog({ note, onClose, onConfirm }: DeleteNoteDialogProps): JSX.Element {
  return (
    <Dialog
      open={!!note}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      slotProps={{ paper: { className: 'delete-note-dialog' } }}
    >
      {note && (
        <Box className="delete-note-dialog-content">
          <Typography className="delete-note-dialog-title">
            Supprimer « {note.title || 'Sans titre'} » ?
          </Typography>
          <Typography className="delete-note-dialog-subtitle">
            Cette action est définitive, la note sera perdue.
          </Typography>
          <Box className="delete-note-dialog-actions">
            <Button variant="outlined" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="contained" color="error" onClick={onConfirm}>
              Supprimer
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
