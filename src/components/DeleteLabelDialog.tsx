import { Box, Button, Dialog, Typography } from '@mui/material'
import type { JSX } from 'react'
import './DeleteNoteDialog.less'

interface DeleteLabelDialogProps {
  label: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteLabelDialog({ label, onClose, onConfirm }: DeleteLabelDialogProps): JSX.Element {
  return (
    <Dialog
      open={!!label}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      slotProps={{ paper: { className: 'delete-note-dialog' } }}
    >
      {label && (
        <Box className="delete-note-dialog-content">
          <Typography className="delete-note-dialog-title">Supprimer le libellé « {label} » ?</Typography>
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
