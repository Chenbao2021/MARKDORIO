import { Autocomplete, Box, Chip, IconButton, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type JSX,
  type SyntheticEvent,
  type UIEvent,
} from 'react'
import type { Note } from '../data/note'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useNotesSync } from '../hooks/useNotesSync'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { FONT_MAP } from '../data/fonts'
import { NEW_NOTE_PLACEHOLDER } from '../data/newNoteTemplate'
import { loadGoogleFont } from '../utils/loadGoogleFont'
import SettingsMenu from './SettingsMenu'
import MarkdownPreview from './MarkdownPreview'
import './NoteEditor.less'

const AUTO_SAVE_KEY = 'markdorio.autoSaveEnabled'

interface NoteEditorProps {
  note: Note
  onRequestDelete: (note: Note) => void
}

const TrashDoodle = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M3 5 H15" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M6 5 V3.5 A1 1 0 0 1 7 2.5 H11 A1 1 0 0 1 12 3.5 V5"
      stroke="#2d2d2d"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 5 L5.3 15 A1 1 0 0 0 6.3 16 H11.7 A1 1 0 0 0 12.7 15 L13.5 5"
      stroke="#2d2d2d"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LabelDoodle = (): JSX.Element => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="note-editor-labels-icon">
    <path d="M2 2 H7.5 L14 8.5 L8.5 14 L2 7.5 Z" stroke="#6b7280" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="4.7" cy="4.7" r="1" fill="#6b7280" />
  </svg>
)

type MobileView = 'write' | 'preview'

export default function NoteEditor({ note, onRequestDelete }: NoteEditorProps): JSX.Element {
  const { updateNote, allLabels } = useNotes()
  const { user } = useAuth()
  const { syncNow } = useNotesSync()
  const [autoSave, setAutoSave] = useLocalStorage<boolean>(AUTO_SAVE_KEY, false)
  const [mobileView, setMobileView] = useState<MobileView>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const programmaticScroll = useRef<'write' | 'preview' | null>(null)

  useEffect(() => {
    if (note.fontFamily) {
      const font = FONT_MAP[note.fontFamily]
      if (font) loadGoogleFont(font.googleParam)
    }
  }, [note.fontFamily])

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateNote(note.id, { title: e.target.value }),
    [note.id, updateNote],
  )

  const handleContentChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => updateNote(note.id, { content: e.target.value }),
    [note.id, updateNote],
  )

  const handleFontChange = useCallback(
    (fontId: string | null) => updateNote(note.id, { fontFamily: fontId }),
    [note.id, updateNote],
  )

  const handleTextareaBlur = useCallback(() => {
    if (autoSave && user) void syncNow()
  }, [autoSave, user, syncNow])

  const handleLabelsChange = useCallback(
    (_: SyntheticEvent, newValue: string[]) => {
      const cleaned = [...new Set(newValue.map((label) => label.trim()).filter(Boolean))]
      updateNote(note.id, { labels: cleaned })
    },
    [note.id, updateNote],
  )

  const handleMobileViewChange = useCallback((_: unknown, value: MobileView | null) => {
    if (value) setMobileView(value)
  }, [])

  const handleWriteScroll = useCallback((_: UIEvent<HTMLTextAreaElement>) => {
    if (programmaticScroll.current === 'write') {
      programmaticScroll.current = null
      return
    }
    const textarea = textareaRef.current
    const preview = previewRef.current
    if (!textarea || !preview) return
    const maxScroll = textarea.scrollHeight - textarea.clientHeight
    const ratio = maxScroll > 0 ? textarea.scrollTop / maxScroll : 0
    programmaticScroll.current = 'preview'
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
  }, [])

  const handlePreviewScroll = useCallback((_: UIEvent<HTMLDivElement>) => {
    if (programmaticScroll.current === 'preview') {
      programmaticScroll.current = null
      return
    }
    const textarea = textareaRef.current
    const preview = previewRef.current
    if (!textarea || !preview) return
    const maxScroll = preview.scrollHeight - preview.clientHeight
    const ratio = maxScroll > 0 ? preview.scrollTop / maxScroll : 0
    programmaticScroll.current = 'write'
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight)
  }, [])

  const activeFontFamily = note.fontFamily ? (FONT_MAP[note.fontFamily]?.family ?? null) : null

  return (
    <Box className="note-editor">
      <Box className="note-editor-topbar">
        <TextField
          variant="standard"
          placeholder="Sans titre"
          value={note.title}
          onChange={handleTitleChange}
          className="note-editor-title-input"
          slotProps={{ input: { disableUnderline: true } }}
        />
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={allLabels}
          value={note.labels}
          onChange={handleLabelsChange}
          className="note-editor-labels-input"
          renderValue={(tagValue, getItemProps) =>
            tagValue.map((label, index) => {
              const { key, ...itemProps } = getItemProps({ index })
              return <Chip label={label} size="small" key={key} {...itemProps} />
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder="Ajouter un libellé…"
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  disableUnderline: true,
                  startAdornment: (
                    <>
                      <LabelDoodle />
                      {params.slotProps.input.startAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
        <Box className="note-editor-topbar-actions">
          <SettingsMenu
            fontValue={note.fontFamily}
            onFontChange={handleFontChange}
            autoSave={autoSave}
            onAutoSaveChange={setAutoSave}
          />
          <IconButton
            aria-label="Supprimer la note"
            className="note-editor-delete-btn"
            onClick={() => onRequestDelete(note)}
          >
            <TrashDoodle />
          </IconButton>
        </Box>
      </Box>

      <ToggleButtonGroup
        className="note-editor-mobile-toggle"
        value={mobileView}
        exclusive
        onChange={handleMobileViewChange}
        size="small"
      >
        <ToggleButton value="write">Écriture</ToggleButton>
        <ToggleButton value="preview">Aperçu</ToggleButton>
      </ToggleButtonGroup>

      <Box className="note-editor-panes">
        <Box
          className={`note-editor-pane note-editor-pane--write${mobileView === 'write' ? ' is-active-mobile' : ''}`}
        >
          <textarea
            ref={textareaRef}
            className="note-editor-textarea"
            value={note.content}
            onChange={handleContentChange}
            onScroll={handleWriteScroll}
            onBlur={handleTextareaBlur}
            spellCheck={false}
            placeholder={NEW_NOTE_PLACEHOLDER}
          />
        </Box>
        <Box
          className={`note-editor-pane note-editor-pane--preview${mobileView === 'preview' ? ' is-active-mobile' : ''}`}
        >
          <MarkdownPreview
            ref={previewRef}
            content={note.content}
            fontFamily={activeFontFamily}
            onScroll={handlePreviewScroll}
          />
        </Box>
      </Box>
    </Box>
  )
}
