export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  labels: string[]
  fontFamily: string | null
  isPublic: boolean
}

export function normalizeNote(
  note: Partial<Note> & Pick<Note, 'id' | 'title' | 'content' | 'createdAt' | 'updatedAt'>,
): Note {
  return {
    ...note,
    labels: note.labels ?? [],
    fontFamily: note.fontFamily ?? null,
    isPublic: note.isPublic ?? false,
  }
}

export interface SharedNote {
  ownerId: string
  title: string
  content: string
  fontFamily: string | null
  updatedAt: number
}
