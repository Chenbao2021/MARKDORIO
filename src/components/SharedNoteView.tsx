import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { SharedNote } from '../data/note'
import { FONT_MAP } from '../data/fonts'
import { CONTENT_FONT_SIZE_KEY, FONT_SIZE_MAP, DEFAULT_FONT_SIZE_ID } from '../data/fontSizes'
import { readJSON } from '../hooks/useLocalStorage'
import { loadGoogleFont } from '../utils/loadGoogleFont'
import MarkdownPreview from './MarkdownPreview'
import './SharedNoteView.less'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

export default function SharedNoteView(): JSX.Element {
  const { noteId } = useParams<{ noteId: string }>()
  const [state, setState] = useState<LoadState>('loading')
  const [note, setNote] = useState<SharedNote | null>(null)

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setNote(null)

    if (!noteId || !db) {
      setState('error')
      return
    }

    getDoc(doc(db, 'sharedNotes', noteId))
      .then((snapshot) => {
        if (cancelled) return
        if (!snapshot.exists()) {
          setState('not-found')
          return
        }
        setNote(snapshot.data() as SharedNote)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [noteId])

  useEffect(() => {
    if (note?.fontFamily) {
      const font = FONT_MAP[note.fontFamily]
      if (font) loadGoogleFont(font.googleParam)
    }
  }, [note?.fontFamily])

  const activeFontFamily = note?.fontFamily ? (FONT_MAP[note.fontFamily]?.family ?? null) : null
  const contentFontSizeId = readJSON<string>(CONTENT_FONT_SIZE_KEY, DEFAULT_FONT_SIZE_ID)
  const contentFontSizePx = (FONT_SIZE_MAP[contentFontSizeId] ?? FONT_SIZE_MAP[DEFAULT_FONT_SIZE_ID]).px
  const contentFontSizeStyle = { '--content-font-size': `${contentFontSizePx}px` } as CSSProperties

  return (
    <Box className="shared-note-view">
      <Box className="shared-note-view-header">
        <Link to="/" className="shared-note-view-brand">
          Markdorio
        </Link>
        {state === 'ready' && <Chip label="Lecture seule" size="small" className="shared-note-view-badge" />}
      </Box>

      {state === 'loading' && (
        <Box className="shared-note-view-status">
          <CircularProgress size={28} />
        </Box>
      )}

      {state === 'not-found' && (
        <Box className="shared-note-view-status">
          <Typography className="shared-note-view-status-text">
            Cette note n'est plus partagée ou n'existe pas.
          </Typography>
        </Box>
      )}

      {state === 'error' && (
        <Box className="shared-note-view-status">
          <Typography className="shared-note-view-status-text">Impossible de charger cette note.</Typography>
        </Box>
      )}

      {state === 'ready' && note && (
        <Box className="shared-note-view-content" style={contentFontSizeStyle}>
          <Typography variant="h4" className="shared-note-view-title">
            {note.title || 'Sans titre'}
          </Typography>
          <MarkdownPreview content={note.content} fontFamily={activeFontFamily} />
        </Box>
      )}
    </Box>
  )
}
