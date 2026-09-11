import { Box, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import CopyButton from './CopyButton'

const styles = {
  codeBlock: {
    position: 'relative',
    my: 1,
    p: 1.5,
    borderRadius: 1.5,
    bgcolor: 'action.hover',
    fontFamily: 'Consolas, monospace',
    fontSize: '0.9em',
    lineHeight: 1.5,
    overflowX: 'auto',
  },
  inlineCode: {
    bgcolor: 'action.hover',
    px: 0.75,
    py: 0.25,
    borderRadius: '4px',
    fontSize: '0.95em',
    fontFamily: 'Consolas, monospace',
  },
  copyButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 0.9 },
  },
}

const StyledContainer = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '1rem',
  padding: theme.spacing(1, 2),
  // Add max height and scrolling
  maxHeight: 'calc(50vh - 100px)', // Account for header and padding
  overflowY: 'auto',
  // Horizontal scroll for tables and code blocks
  '& pre, & .math, & table': {
    maxWidth: '100%',
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
  },
  '& h1': {
    margin: '12px 0',
    fontSize: '1.3rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  '& h2': {
    margin: '10px 0',
    fontSize: '1.2rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  '& p': {
    margin: '8px 0',
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  '& pre code': {
    display: 'block',
    overflow: 'auto',
  },
  '& .math': {
    overflow: 'auto',
    padding: theme.spacing(1.5, 0),
    fontSize: '1rem',
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontSize: 'inherit',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& ul, & ol': {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 28,
  },
  '& li': {
    margin: '6px 0',
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    margin: theme.spacing(1.5, 0),
    fontSize: '0.95rem',
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 1.5),
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.action.hover,
    fontWeight: 600,
  },
}))

const MarkdownContent = ({ content, innerRef, sx = [] }) => {
  const components = useMemo(
    () => ({
      code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className) || String(children).includes('\n')
        if (!isBlock) {
          return (
            <Box component="code" sx={styles.inlineCode} {...props}>
              {children}
            </Box>
          )
        }
        const codeText = String(children).trim()
        return (
          <Box sx={styles.codeBlock}>
            <Box component="pre" sx={{ m: 0, p: 0, overflowX: 'auto' }}>
              <Box component="code" {...props}>
                {children}
              </Box>
            </Box>
            <Box sx={styles.copyButton}>
              <CopyButton
                tooltip="Copy code"
                size={16}
                getText={() => codeText}
              />
            </Box>
          </Box>
        )
      },
    }),
    []
  )
  return (
    <StyledContainer ref={innerRef} {...{ sx }}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        {...{ components }}
      >
        {content}
      </ReactMarkdown>
    </StyledContainer>
  )
}
MarkdownContent.propTypes = {
  content: PropTypes.string.isRequired,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default memo(MarkdownContent)
