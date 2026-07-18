import { useCallback, useState } from 'react'
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import type { Note, SharedNote } from '../data/note'

interface UseShareNoteResult {
  isSharing: boolean
  shareError: string | null
  publishNote: (note: Note) => Promise<void>
  unpublishNote: (note: Note) => Promise<void>
  updateSharedLabels: (noteId: string, labels: string[]) => Promise<void>
  backupNote: (note: Note) => Promise<void>
}

export function useShareNote(): UseShareNoteResult {
  const { user } = useAuth()
  const { updateNote } = useNotes()
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const publishNote = useCallback(
    async (note: Note) => {
      if (!user || !db) {
        setShareError('Connecte-toi pour partager cette note')
        return
      }
      setIsSharing(true)
      setShareError(null)
      try {
        const shared: SharedNote = {
          ownerId: user.uid,
          title: note.title,
          content: note.content,
          fontFamily: note.fontFamily,
          updatedAt: note.updatedAt,
          labels: note.labels,
        }
        await setDoc(doc(db, 'sharedNotes', note.id), shared)
        updateNote(note.id, { isPublic: true })
      } catch {
        setShareError('Impossible de partager cette note')
      } finally {
        setIsSharing(false)
      }
    },
    [user, updateNote],
  )

  const unpublishNote = useCallback(
    async (note: Note) => {
      setIsSharing(true)
      setShareError(null)
      try {
        if (db) await deleteDoc(doc(db, 'sharedNotes', note.id))
        updateNote(note.id, { isPublic: false })
      } catch {
        setShareError("Impossible d'arrêter le partage")
      } finally {
        setIsSharing(false)
      }
    },
    [updateNote],
  )

  const updateSharedLabels = useCallback(async (noteId: string, labels: string[]) => {
    if (!db) return
    try {
      await updateDoc(doc(db, 'sharedNotes', noteId), { labels })
    } catch {
      // la prochaine synchronisation complète rattrapera l'écart
    }
  }, [])

  const backupNote = useCallback(
    async (note: Note) => {
      if (!user || !db) {
        setShareError('Connecte-toi pour sauvegarder cette note en ligne')
        return
      }
      setIsSharing(true)
      setShareError(null)
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', note.id), note)
      } catch {
        setShareError('Impossible de sauvegarder cette note en ligne')
      } finally {
        setIsSharing(false)
      }
    },
    [user],
  )

  return { isSharing, shareError, publishNote, unpublishNote, updateSharedLabels, backupNote }
}
