import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import type { SharedNote } from '../data/note'

const PUBLIC_NOTES_LIMIT = 50

export interface PublicSharedNote extends SharedNote {
  id: string
}

interface UsePublicSharedNotesResult {
  publicNotes: PublicSharedNote[]
  isLoading: boolean
}

export function usePublicSharedNotes(): UsePublicSharedNotesResult {
  const [publicNotes, setPublicNotes] = useState<PublicSharedNote[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!db) return

    setIsLoading(true)
    const q = query(collection(db, 'sharedNotes'), orderBy('updatedAt', 'desc'), limit(PUBLIC_NOTES_LIMIT))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPublicNotes(
          snapshot.docs.map((d) => {
            const data = d.data() as SharedNote
            return { id: d.id, ...data, labels: data.labels ?? [] }
          }),
        )
        setIsLoading(false)
      },
      () => setIsLoading(false),
    )
    return unsubscribe
  }, [])

  return { publicNotes, isLoading }
}
