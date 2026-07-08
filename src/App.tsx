import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material'
import { useCallback, useState, type JSX } from 'react'
import AppHeader from './components/AppHeader'
import NotesSidebar from './components/NotesSidebar'
import NoteEditor from './components/NoteEditor'
import EmptyState from './components/EmptyState'
import DeleteNoteDialog from './components/DeleteNoteDialog'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import { NotesProvider, useNotes } from './context/NotesContext'
import { AuthProvider } from './context/AuthContext'
import { useNotesSync } from './hooks/useNotesSync'
import type { Note } from './data/note'
import './index.less'
import './App.less'

const theme = createTheme({
  palette: {
    background: { default: '#faf9f7', paper: '#fffef9' },
    primary: { main: '#2d2d2d' },
    secondary: { main: '#ca8a04' },
    text: { primary: '#2d2d2d', secondary: '#6b7280' },
  },
  typography: {
    fontFamily: '"Nunito", sans-serif',
    h1: { fontFamily: '"Caveat", cursive' },
    h2: { fontFamily: '"Caveat", cursive' },
    h3: { fontFamily: '"Caveat", cursive' },
    h4: { fontFamily: '"Caveat", cursive' },
    h5: { fontFamily: '"Caveat", cursive' },
    h6: { fontFamily: '"Caveat", cursive' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { background: '#faf9f7' } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Caveat", cursive',
          fontSize: '1.1rem',
          borderRadius: '4px 9px 6px 4px',
          transition: 'all 0.15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          border: '2px solid #2d2d2d',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '5px 5px 0 rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          boxShadow: '2px 2px 0 rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Nunito", sans-serif',
          fontWeight: 600,
          fontSize: '0.78rem',
        },
      },
    },
  },
})

function AppShell(): JSX.Element {
  const { selectedNote, deleteNote } = useNotes()
  const { deleteRemoteNote } = useNotesSync()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id)
      void deleteRemoteNote(noteToDelete.id)
    }
    setNoteToDelete(null)
  }, [noteToDelete, deleteNote, deleteRemoteNote])

  return (
    <div className="app-shell">
      <AppHeader onToggleSidebar={toggleSidebar} />
      <div className="app-body">
        <div className={`app-sidebar-col${sidebarOpen ? ' is-open' : ''}`}>
          <NotesSidebar onRequestDelete={setNoteToDelete} onNoteSelected={closeSidebar} />
        </div>
        <div className="app-main-col">
          {selectedNote ? (
            <NoteEditor note={selectedNote} onRequestDelete={setNoteToDelete} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <DeleteNoteDialog note={noteToDelete} onClose={() => setNoteToDelete(null)} onConfirm={handleConfirmDelete} />
      <PwaUpdatePrompt />
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotesProvider>
            <AppShell />
          </NotesProvider>
        </AuthProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
