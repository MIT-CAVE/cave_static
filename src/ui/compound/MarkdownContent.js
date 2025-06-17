import { Box, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import CopyButton from './CopyButton'

const styles = {
  code: {
    position: 'relative',
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
  '& code': {
    backgroundColor: theme.palette.action.hover,
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: '0.95em',
    fontFamily: 'Consolas, monospace',
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
        const match = /language-(\w+)/.exec(className || '')
        if (match == null) {
          return <code {...props}>{children}</code>
        }
        const code = String(children).trim()
        return (
          <Box sx={styles.code}>
            <SyntaxHighlighter
              style={materialDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: 6,
                fontSize: '0.9em',
                lineHeight: 1.5,
              }}
            >
              {code}
            </SyntaxHighlighter>
            <Box sx={styles.copyButton}>
              <CopyButton tooltip="Copy code" size={16} getText={() => code} />
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
}

export default memo(MarkdownContent)
