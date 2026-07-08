import { Box, Button, Typography } from '@mui/material'
import type { JSX } from 'react'
import { useNotes } from '../context/NotesContext'
import './EmptyState.less'

const NotebookDoodle = (): JSX.Element => (
  <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
    <rect x="20" y="10" width="70" height="80" rx="4" stroke="#2d2d2d" strokeWidth="2.5" fill="#fffef9" />
    <path d="M32 30 H78" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 45 H78" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 58 H60" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
    <path d="M85 65 Q 100 60 108 45" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path
      d="M100 40 L110 46 L102 54"
      stroke="#9ca3af"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function EmptyState(): JSX.Element {
  const { createNote } = useNotes()

  return (
    <Box className="empty-state fade-in">
      <NotebookDoodle />
      <Typography className="empty-state-title">Aucune note sélectionnée</Typography>
      <Typography className="empty-state-subtitle">
        Choisis une note dans la liste, ou crée-en une nouvelle.
      </Typography>
      <Button variant="contained" onClick={() => createNote()}>
        + Nouvelle note
      </Button>
    </Box>
  )
}
