import { Autocomplete, Box, Button, Dialog, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import type { JSX, SyntheticEvent } from 'react'
import './FilterNotesDialog.less'

export type DateFilter = 'all' | 'today' | '7d' | '30d'

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
]

interface FilterNotesDialogProps {
  open: boolean
  onClose: () => void
  allLabels: string[]
  selectedLabels: string[]
  onSelectedLabelsChange: (labels: string[]) => void
  dateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
  onReset: () => void
}

export default function FilterNotesDialog({
  open,
  onClose,
  allLabels,
  selectedLabels,
  onSelectedLabelsChange,
  dateFilter,
  onDateFilterChange,
  onReset,
}: FilterNotesDialogProps): JSX.Element {
  const handleLabelsChange = (_: SyntheticEvent, newValue: string[]) => onSelectedLabelsChange(newValue)

  const handleDateFilterChange = (_: unknown, value: DateFilter | null) => {
    if (value) onDateFilterChange(value)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      slotProps={{ paper: { className: 'filter-notes-dialog' } }}
    >
      <Box className="filter-notes-dialog-content">
        <Typography className="filter-notes-dialog-title">Filtrer les notes</Typography>

        <Box className="filter-notes-dialog-section">
          <Typography className="filter-notes-dialog-label">Libellés</Typography>
          {allLabels.length === 0 ? (
            <Typography className="filter-notes-dialog-empty">Aucun libellé pour l'instant.</Typography>
          ) : (
            <Autocomplete
              multiple
              size="small"
              options={allLabels}
              value={selectedLabels}
              onChange={handleLabelsChange}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" placeholder="Choisir des libellés…" />
              )}
            />
          )}
        </Box>

        <Box className="filter-notes-dialog-section">
          <Typography className="filter-notes-dialog-label">Date</Typography>
          <ToggleButtonGroup
            value={dateFilter}
            exclusive
            onChange={handleDateFilterChange}
            size="small"
            className="filter-notes-dialog-date-toggle"
          >
            {DATE_FILTER_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box className="filter-notes-dialog-actions">
          <Button variant="outlined" onClick={onReset}>
            Réinitialiser
          </Button>
          <Button variant="contained" onClick={onClose}>
            Fermer
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
