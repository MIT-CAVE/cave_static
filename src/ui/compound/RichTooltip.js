import { Box, Tooltip, Typography, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback, useRef } from 'react'

import CopyButton from './CopyButton'
import MarkdownContent from './MarkdownContent'

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    padding: 0,
    backgroundColor: theme.palette.background.paper,
    maxHeight: '50vh',
    maxWidth: '480px',
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius,
    border: '1px outset rgb(128 128 128)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '& .MuiTooltip-arrow': {
    color: theme.palette.background.paper,
  },
}))

const HeaderBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}))

const RichTooltip = ({ title, content, children, ...props }) => {
  const contentRef = useRef(null)
  const getRawText = useCallback(() => content, [content])
  return (
    <StyledTooltip
      arrow
      enterDelay={100}
      leaveDelay={200}
      placement="top"
      title={
        <div>
          <HeaderBox>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ flexGrow: 1 }}
            >
              {`Help \u203A ${title}`}
            </Typography>

            <CopyButton
              getText={getRawText}
              tooltip="Copy content to clipboard"
            />
          </HeaderBox>
          <MarkdownContent {...{ content }} innerRef={contentRef} />
        </div>
      }
      {...props}
    >
      {children}
    </StyledTooltip>
  )
}

RichTooltip.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export default RichTooltip
