import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react'
import { normalizeNote, type Note } from '../data/note'
import { DEFAULT_NOTE_TITLE } from '../data/newNoteTemplate'
import { readJSON, writeJSON, useLocalStorage } from '../hooks/useLocalStorage'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'

const NOTES_KEY = 'markdorio.notes'
const SELECTED_NOTE_KEY = 'markdorio.selectedNoteId'
const DELETED_IDS_KEY = 'markdorio.deletedNoteIds'
const AUTOSAVE_DELAY_MS = 500

interface NotesContextValue {
  notes: Note[]
  selectedNote: Note | null
  selectedNoteId: string | null
  deletedNoteIds: string[]
  allLabels: string[]
  selectNote: (id: string | null) => void
  createNote: () => string
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'labels' | 'fontFamily' | 'isPublic'>>) => void
  deleteNote: (id: string) => void
  replaceAllNotes: (next: Note[]) => void
  clearDeletedNoteIds: (ids: string[]) => void
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within a NotesProvider')
  return ctx
}

export function NotesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [notes, setNotes] = useState<Note[]>(() => readJSON<Note[]>(NOTES_KEY, []).map(normalizeNote))
  const [selectedNoteId, setSelectedNoteId] = useLocalStorage<string | null>(SELECTED_NOTE_KEY, null)
  const [deletedNoteIds, setDeletedNoteIds] = useLocalStorage<string[]>(DELETED_IDS_KEY, [])

  const { call: scheduleSave, flush: flushSave } = useDebouncedCallback((next: Note[]) => {
    writeJSON(NOTES_KEY, next)
  }, AUTOSAVE_DELAY_MS)

  useEffect(() => {
    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }
    window.addEventListener('beforeunload', flushSave)
    document.addEventListener('visibilitychange', flushOnHide)
    return () => {
      window.removeEventListener('beforeunload', flushSave)
      document.removeEventListener('visibilitychange', flushOnHide)
    }
  }, [flushSave])

  const selectNote = useCallback(
    (id: string | null) => {
      flushSave()
      setSelectedNoteId(id)
    },
    [flushSave, setSelectedNoteId],
  )

  const createNote = useCallback((): string => {
    flushSave()
    const now = Date.now()
    const note: Note = {
      id: crypto.randomUUID(),
      title: DEFAULT_NOTE_TITLE,
      content: '',
      createdAt: now,
      updatedAt: now,
      labels: [],
      fontFamily: null,
      isPublic: false,
    }
    setNotes((prev) => {
      const next = [note, ...prev]
      writeJSON(NOTES_KEY, next)
      return next
    })
    setSelectedNoteId(note.id)
    return note.id
  }, [flushSave, setSelectedNoteId])

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'labels' | 'fontFamily' | 'isPublic'>>) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const deleteNote = useCallback(
    (id: string) => {
      flushSave()
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id)
        writeJSON(NOTES_KEY, next)
        return next
      })
      if (selectedNoteId === id) setSelectedNoteId(null)
      if (!deletedNoteIds.includes(id)) setDeletedNoteIds([...deletedNoteIds, id])
    },
    [flushSave, selectedNoteId, setSelectedNoteId, deletedNoteIds, setDeletedNoteIds],
  )

  const replaceAllNotes = useCallback((next: Note[]) => {
    setNotes(next)
    writeJSON(NOTES_KEY, next)
  }, [])

  const clearDeletedNoteIds = useCallback(
    (ids: string[]) => {
      const toRemove = new Set(ids)
      setDeletedNoteIds(deletedNoteIds.filter((id) => !toRemove.has(id)))
    },
    [deletedNoteIds, setDeletedNoteIds],
  )

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes])
  const selectedNote = useMemo(
    () => sortedNotes.find((n) => n.id === selectedNoteId) ?? null,
    [sortedNotes, selectedNoteId],
  )
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>()
    for (const note of notes) {
      for (const label of note.labels) labelSet.add(label)
    }
    return [...labelSet].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [notes])

  const value = useMemo<NotesContextValue>(
    () => ({
      notes: sortedNotes,
      selectedNote,
      selectedNoteId,
      deletedNoteIds,
      allLabels,
      selectNote,
      createNote,
      updateNote,
      deleteNote,
      replaceAllNotes,
      clearDeletedNoteIds,
    }),
    [
      sortedNotes,
      selectedNote,
      selectedNoteId,
      deletedNoteIds,
      allLabels,
      selectNote,
      createNote,
      updateNote,
      deleteNote,
      replaceAllNotes,
      clearDeletedNoteIds,
    ],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
