import { Box, Button, Chip, IconButton, Typography } from '@mui/material'
import { useCallback, useMemo, useState, type JSX, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Note } from '../data/note'
import { useNotes } from '../context/NotesContext'
import { useAuth } from '../context/AuthContext'
import { usePublicSharedNotes, type PublicSharedNote } from '../hooks/usePublicSharedNotes'
import { useShareNote } from '../hooks/useShareNote'
import FilterNotesDialog, { type DateFilter } from './FilterNotesDialog'
import './NotesSidebar.less'

interface NotesSidebarProps {
  onRequestDelete: (note: Note) => void
  onNoteSelected?: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const TrashDoodle = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

const SearchDoodle = (): JSX.Element => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5" stroke="#2d2d2d" strokeWidth="1.6" />
    <path d="M11.5 11.5 L16 16" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const ChevronDoodle = ({ isOpen }: { isOpen: boolean }): JSX.Element => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className={`notes-sidebar-chevron${isOpen ? ' is-open' : ''}`}
  >
    <path d="M3 4.5 L6 7.5 L9 4.5" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RailToggleDoodle = ({ collapsed }: { collapsed: boolean }): JSX.Element => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    className={`notes-sidebar-rail-toggle${collapsed ? ' is-collapsed' : ''}`}
  >
    <path d="M9 2 L4 7 L9 12" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyDoodle = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2 V12 M2 7 H12" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const CheckDoodle = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GlobeDoodle = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="#6b7280" strokeWidth="1.4" />
    <path d="M2 8 H14 M8 2 C10 4.5 10 11.5 8 14 C6 11.5 6 4.5 8 2" stroke="#6b7280" strokeWidth="1.2" fill="none" />
  </svg>
)

function formatRelativeTime(timestamp: number): string {
  const diffMin = Math.round((Date.now() - timestamp) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffDays = Math.round(diffH / 24)
  return `il y a ${diffDays} j`
}

function matchesDateFilter(timestamp: number, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (filter === 'today') return new Date(timestamp).toDateString() === new Date(now).toDateString()
  if (filter === '7d') return now - timestamp <= 7 * dayMs
  if (filter === '30d') return now - timestamp <= 30 * dayMs
  return true
}

interface NoteListItemProps {
  note: Note
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function NoteListItem({ note, isActive, onSelect, onDelete }: NoteListItemProps): JSX.Element {
  return (
    <Box className={`notes-sidebar-item${isActive ? ' is-active' : ''}`} onClick={onSelect}>
      <Box className="notes-sidebar-item-main">
        <Box className="notes-sidebar-item-title-row">
          {note.isPublic && <GlobeDoodle />}
          <Typography className="notes-sidebar-item-title">{note.title || 'Sans titre'}</Typography>
        </Box>
        <Typography className="notes-sidebar-item-time">{formatRelativeTime(note.updatedAt)}</Typography>
        {note.labels.length > 0 && (
          <Box className="notes-sidebar-item-labels">
            {note.labels.map((label) => (
              <Chip key={label} label={label} size="small" className="notes-sidebar-item-label" />
            ))}
          </Box>
        )}
      </Box>
      <IconButton
        className="notes-sidebar-item-delete"
        aria-label="Supprimer la note"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <TrashDoodle />
      </IconButton>
    </Box>
  )
}

interface PublicNoteListItemProps {
  note: PublicSharedNote
  onSelect: () => void
  onCopy: () => void
}

function PublicNoteListItem({ note, onSelect, onCopy }: PublicNoteListItemProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onCopy()
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    },
    [onCopy],
  )

  return (
    <Box className="notes-sidebar-item notes-sidebar-item--public" onClick={onSelect}>
      <Box className="notes-sidebar-item-main">
        <Box className="notes-sidebar-item-title-row">
          <GlobeDoodle />
          <Typography className="notes-sidebar-item-title">{note.title || 'Sans titre'}</Typography>
        </Box>
        <Typography className="notes-sidebar-item-time">{formatRelativeTime(note.updatedAt)}</Typography>
        {note.labels.length > 0 && (
          <Box className="notes-sidebar-item-labels">
            {note.labels.map((label) => (
              <Chip key={label} label={label} size="small" className="notes-sidebar-item-label" />
            ))}
          </Box>
        )}
      </Box>
      <IconButton
        className="notes-sidebar-item-copy"
        aria-label="Copier dans mes notes"
        onClick={handleCopy}
      >
        {copied ? <CheckDoodle /> : <CopyDoodle />}
      </IconButton>
    </Box>
  )
}

interface NoteEntry {
  id: string
  updatedAt: number
  render: () => JSX.Element
}

export default function NotesSidebar({
  onRequestDelete,
  onNoteSelected,
  collapsed,
  onToggleCollapse,
}: NotesSidebarProps): JSX.Element {
  const { notes, selectedNoteId, selectNote, createNote, importNote, allLabels } = useNotes()
  const { user } = useAuth()
  const { backupNote } = useShareNote()
  const navigate = useNavigate()
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [openLabel, setOpenLabel] = useState<string | null>(null)
  const [openSharedLabel, setOpenSharedLabel] = useState<string | null>(null)
  const { publicNotes } = usePublicSharedNotes()

  const hasActiveFilters = selectedLabels.length > 0 || dateFilter !== 'all'

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const labelMatch =
          selectedLabels.length === 0 || note.labels.some((label) => selectedLabels.includes(label))
        return labelMatch && matchesDateFilter(note.updatedAt, dateFilter)
      }),
    [notes, selectedLabels, dateFilter],
  )

  const filteredPublicNotes = useMemo(
    () =>
      publicNotes.filter((note) => {
        if (note.ownerId === user?.uid) return false
        const labelMatch =
          selectedLabels.length === 0 || note.labels.some((label) => selectedLabels.includes(label))
        return labelMatch && matchesDateFilter(note.updatedAt, dateFilter)
      }),
    [publicNotes, user, selectedLabels, dateFilter],
  )

  const sharedLabels = useMemo(() => {
    const labelSet = new Set<string>()
    for (const note of filteredPublicNotes) {
      for (const label of note.labels) labelSet.add(label)
    }
    return [...labelSet].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [filteredPublicNotes])

  const toOwnEntry = useCallback(
    (note: Note): NoteEntry => ({
      id: note.id,
      updatedAt: note.updatedAt,
      render: () => (
        <NoteListItem
          key={note.id}
          note={note}
          isActive={note.id === selectedNoteId}
          onSelect={() => {
            selectNote(note.id)
            onNoteSelected?.()
          }}
          onDelete={() => onRequestDelete(note)}
        />
      ),
    }),
    [selectedNoteId, selectNote, onNoteSelected, onRequestDelete],
  )

  const handleCopyPublicNote = useCallback(
    (note: PublicSharedNote) => {
      const created = importNote({
        title: note.title,
        content: note.content,
        labels: note.labels,
        fontFamily: note.fontFamily,
      })
      selectNote(created.id)
      onNoteSelected?.()
      if (user) void backupNote(created)
    },
    [importNote, selectNote, onNoteSelected, user, backupNote],
  )

  const toPublicEntry = useCallback(
    (note: PublicSharedNote): NoteEntry => ({
      id: note.id,
      updatedAt: note.updatedAt,
      render: () => (
        <PublicNoteListItem
          key={note.id}
          note={note}
          onSelect={() => navigate(`/share/${note.id}`)}
          onCopy={() => handleCopyPublicNote(note)}
        />
      ),
    }),
    [navigate, handleCopyPublicNote],
  )

  const ownLabelGroups = useMemo(
    () =>
      allLabels
        .map((label) => ({
          label,
          entries: filteredNotes
            .filter((note) => note.labels.includes(label))
            .map(toOwnEntry)
            .sort((a, b) => b.updatedAt - a.updatedAt),
        }))
        .filter((group) => group.entries.length > 0),
    [allLabels, filteredNotes, toOwnEntry],
  )

  const ownUnlabeledEntries = useMemo<NoteEntry[]>(
    () =>
      filteredNotes
        .filter((note) => note.labels.length === 0)
        .map(toOwnEntry)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredNotes, toOwnEntry],
  )

  const sharedLabelGroups = useMemo(
    () =>
      sharedLabels
        .map((label) => ({
          label,
          entries: filteredPublicNotes
            .filter((note) => note.labels.includes(label))
            .map(toPublicEntry)
            .sort((a, b) => b.updatedAt - a.updatedAt),
        }))
        .filter((group) => group.entries.length > 0),
    [sharedLabels, filteredPublicNotes, toPublicEntry],
  )

  const sharedUnlabeledEntries = useMemo<NoteEntry[]>(
    () =>
      filteredPublicNotes
        .filter((note) => note.labels.length === 0)
        .map(toPublicEntry)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredPublicNotes, toPublicEntry],
  )

  const resetFilters = () => {
    setSelectedLabels([])
    setDateFilter('all')
  }

  return (
    <Box className={`notes-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      {!collapsed && (
        <>
          <Box className="notes-sidebar-actions">
            <IconButton
              className={`notes-sidebar-filter-btn${hasActiveFilters ? ' has-active-filters' : ''}`}
              aria-label="Filtrer les notes"
              onClick={() => setFilterDialogOpen(true)}
            >
              <SearchDoodle />
            </IconButton>
            <Button
              variant="outlined"
              className="notes-sidebar-new-btn"
              onClick={() => {
                createNote()
                onNoteSelected?.()
              }}
            >
              + Nouvelle note
            </Button>
          </Box>
          <Box className="notes-sidebar-list">
            {filteredNotes.length === 0 && filteredPublicNotes.length === 0 && (
              <Typography className="notes-sidebar-empty">
                {notes.length === 0 ? 'Pas encore de note.' : 'Aucune note ne correspond aux filtres.'}
              </Typography>
            )}
            {ownLabelGroups.map((group) => {
              const isOpen = openLabel === group.label
              return (
                <Box key={group.label} className="notes-sidebar-label-group">
                  <Box
                    className="notes-sidebar-label-header"
                    onClick={() => setOpenLabel(isOpen ? null : group.label)}
                    role="button"
                    tabIndex={0}
                  >
                    <Typography className="notes-sidebar-label-title">{group.label}</Typography>
                    <Typography className="notes-sidebar-label-count">{group.entries.length}</Typography>
                    <ChevronDoodle isOpen={isOpen} />
                  </Box>
                  {isOpen && (
                    <Box className="notes-sidebar-label-list">{group.entries.map((entry) => entry.render())}</Box>
                  )}
                </Box>
              )
            })}
            {ownUnlabeledEntries.map((entry) => entry.render())}

            {filteredPublicNotes.length > 0 && (
              <Box className="notes-sidebar-shared-section">
                <Typography className="notes-sidebar-shared-title">Partagées</Typography>
                {sharedLabelGroups.map((group) => {
                  const isOpen = openSharedLabel === group.label
                  return (
                    <Box key={group.label} className="notes-sidebar-label-group">
                      <Box
                        className="notes-sidebar-label-header"
                        onClick={() => setOpenSharedLabel(isOpen ? null : group.label)}
                        role="button"
                        tabIndex={0}
                      >
                        <Typography className="notes-sidebar-label-title">{group.label}</Typography>
                        <Typography className="notes-sidebar-label-count">{group.entries.length}</Typography>
                        <ChevronDoodle isOpen={isOpen} />
                      </Box>
                      {isOpen && (
                        <Box className="notes-sidebar-label-list">{group.entries.map((entry) => entry.render())}</Box>
                      )}
                    </Box>
                  )
                })}
                {sharedUnlabeledEntries.map((entry) => entry.render())}
              </Box>
            )}
          </Box>
        </>
      )}

      <Box className="notes-sidebar-collapse-row">
        <IconButton
          className="notes-sidebar-collapse-btn"
          aria-label={collapsed ? 'Afficher la liste des notes' : 'Réduire la liste des notes'}
          onClick={onToggleCollapse}
        >
          <RailToggleDoodle collapsed={collapsed} />
        </IconButton>
      </Box>

      <FilterNotesDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        allLabels={allLabels}
        selectedLabels={selectedLabels}
        onSelectedLabelsChange={setSelectedLabels}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onReset={resetFilters}
      />
    </Box>
  )
}
