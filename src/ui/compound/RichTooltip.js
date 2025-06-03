import { Box, Tooltip, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback, useRef } from 'react'
import { MdOutlineRawOn } from 'react-icons/md'

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
  padding: theme.spacing(1),
  // marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'flex-end',
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}))

const RichTooltip = ({ content, children, ...props }) => {
  const contentRef = useRef(null)
  const getFormattedText = useCallback(
    () => contentRef.current?.textContent ?? '',
    []
  )
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
            <CopyButton
              getText={getRawText}
              icon={MdOutlineRawOn}
              tooltip="Copy raw text"
            />
            <CopyButton
              getText={getFormattedText}
              tooltip="Copy visible text"
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
