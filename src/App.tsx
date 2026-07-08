import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material'
import { useCallback, useState, type JSX } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import NotesSidebar from './components/NotesSidebar'
import NoteEditor from './components/NoteEditor'
import EmptyState from './components/EmptyState'
import DeleteNoteDialog from './components/DeleteNoteDialog'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import SharedNoteView from './components/SharedNoteView'
import { NotesProvider, useNotes } from './context/NotesContext'
import { AuthProvider } from './context/AuthContext'
import { useNotesSync } from './hooks/useNotesSync'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Note } from './data/note'
import './index.less'
import './App.less'

const AUTO_SAVE_KEY = 'markdorio.autoSaveEnabled'

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
  const { selectedNote, deleteNote, updateNote } = useNotes()
  const { deleteRemoteNote } = useNotesSync()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [autoSave, setAutoSave] = useLocalStorage<boolean>(AUTO_SAVE_KEY, false)

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id)
      void deleteRemoteNote(noteToDelete.id)
    }
    setNoteToDelete(null)
  }, [noteToDelete, deleteNote, deleteRemoteNote])

  const handleFontChange = useCallback(
    (fontId: string | null) => {
      if (selectedNote) updateNote(selectedNote.id, { fontFamily: fontId })
    },
    [selectedNote, updateNote],
  )

  return (
    <div className="app-shell">
      <AppHeader
        onToggleSidebar={toggleSidebar}
        fontValue={selectedNote?.fontFamily ?? null}
        onFontChange={handleFontChange}
        autoSave={autoSave}
        onAutoSaveChange={setAutoSave}
      />
      <div className="app-body">
        <div className={`app-sidebar-col${sidebarOpen ? ' is-open' : ''}`}>
          <NotesSidebar onRequestDelete={setNoteToDelete} onNoteSelected={closeSidebar} />
        </div>
        <div className="app-main-col">
          {selectedNote ? <NoteEditor note={selectedNote} autoSave={autoSave} /> : <EmptyState />}
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
        <BrowserRouter>
          <Routes>
            <Route path="/share/:noteId" element={<SharedNoteView />} />
            <Route
              path="/*"
              element={
                <AuthProvider>
                  <NotesProvider>
                    <AppShell />
                  </NotesProvider>
                </AuthProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
