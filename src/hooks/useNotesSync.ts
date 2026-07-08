import { useCallback, useRef, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { normalizeNote, type Note, type SharedNote } from '../data/note'
import { useLocalStorage } from './useLocalStorage'

const LAST_SYNCED_KEY = 'markdorio.lastSyncedAt'

interface UseNotesSyncResult {
  isSyncing: boolean
  lastSyncedAt: number | null
  syncError: string | null
  syncNow: () => Promise<void>
  deleteRemoteNote: (id: string) => Promise<void>
}

export function useNotesSync(): UseNotesSyncResult {
  const { user } = useAuth()
  const { notes, deletedNoteIds, replaceAllNotes, clearDeletedNoteIds } = useNotes()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useLocalStorage<number | null>(LAST_SYNCED_KEY, null)
  const syncingRef = useRef(false)

  const deleteRemoteNote = useCallback(
    async (id: string): Promise<void> => {
      if (!user || !db) return
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', id))
        clearDeletedNoteIds([id])
      } catch {
        // reste dans deletedNoteIds, sera retenté à la prochaine synchronisation
      }
    },
    [user, clearDeletedNoteIds],
  )

  const syncNow = useCallback(async () => {
    if (!user) {
      setSyncError('Connecte-toi pour synchroniser')
      return
    }
    if (!db) {
      setSyncError("La synchronisation n'est pas configurée pour cette app")
      return
    }
    const firestore = db
    if (syncingRef.current) return
    syncingRef.current = true
    setIsSyncing(true)
    setSyncError(null)

    try {
      const snapshot = await getDocs(collection(firestore, 'users', user.uid, 'notes'))
      const deletedSet = new Set(deletedNoteIds)
      const cloudNotes = snapshot.docs
        .map((d) => normalizeNote(d.data() as Note))
        .filter((n) => !deletedSet.has(n.id))

      if (deletedNoteIds.length > 0) {
        const deleteResults = await Promise.allSettled(
          deletedNoteIds.map((id) => deleteDoc(doc(firestore, 'users', user.uid, 'notes', id))),
        )
        const removedIds = deletedNoteIds.filter((_, i) => deleteResults[i].status === 'fulfilled')
        if (removedIds.length > 0) clearDeletedNoteIds(removedIds)
      }

      const localById = new Map(notes.map((n) => [n.id, n]))
      const cloudById = new Map(cloudNotes.map((n) => [n.id, n]))

      const toUpload: Note[] = []
      for (const [id, localNote] of localById) {
        const cloudNote = cloudById.get(id)
        if (!cloudNote || localNote.updatedAt > cloudNote.updatedAt) {
          toUpload.push(localNote)
        }
      }

      const uploadResults = await Promise.allSettled(
        toUpload.map((n) => setDoc(doc(firestore, 'users', user.uid, 'notes', n.id), n)),
      )
      const hadFailures = uploadResults.some((r) => r.status === 'rejected')

      const publicToUpload = toUpload.filter((n) => n.isPublic)
      if (publicToUpload.length > 0) {
        await Promise.allSettled(
          publicToUpload.map((n) => {
            const shared: SharedNote = {
              ownerId: user.uid,
              title: n.title,
              content: n.content,
              fontFamily: n.fontFamily,
              updatedAt: n.updatedAt,
            }
            return setDoc(doc(firestore, 'sharedNotes', n.id), shared)
          }),
        )
      }

      const allIds = new Set([...localById.keys(), ...cloudById.keys()])
      const merged: Note[] = []
      for (const id of allIds) {
        const localNote = localById.get(id)
        const cloudNote = cloudById.get(id)
        if (localNote && cloudNote) {
          merged.push(localNote.updatedAt >= cloudNote.updatedAt ? localNote : cloudNote)
        } else {
          merged.push((localNote ?? cloudNote)!)
        }
      }

      replaceAllNotes(merged)
      setLastSyncedAt(Date.now())
      setSyncError(hadFailures ? "Certaines notes n'ont pas pu être envoyées" : null)
    } catch {
      setSyncError('Échec de la synchronisation, réessaie plus tard')
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
    }
  }, [user, notes, deletedNoteIds, replaceAllNotes, clearDeletedNoteIds, setLastSyncedAt])

  return { isSyncing, lastSyncedAt, syncError, syncNow, deleteRemoteNote }
}
