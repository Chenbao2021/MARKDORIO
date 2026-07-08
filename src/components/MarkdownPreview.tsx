import { Box, Typography } from '@mui/material'
import { forwardRef, type UIEventHandler } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownPreview.less'

interface MarkdownPreviewProps {
  content: string
  fontFamily?: string | null
  onScroll?: UIEventHandler<HTMLDivElement>
}

const MarkdownPreview = forwardRef<HTMLDivElement, MarkdownPreviewProps>(function MarkdownPreview(
  { content, fontFamily, onScroll },
  ref,
) {
  const isEmpty = content.trim().length === 0

  return (
    <Box
      ref={ref}
      onScroll={onScroll}
      className={`markdown-preview${fontFamily ? ' has-custom-font' : ''}${isEmpty ? ' is-empty' : ''}`}
      style={fontFamily ? { fontFamily } : undefined}
    >
      {isEmpty ? (
        <Typography className="markdown-preview-empty-hint">L'aperçu apparaîtra ici</Typography>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      )}
    </Box>
  )
})

export default MarkdownPreview
