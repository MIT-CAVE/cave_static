import { Box, IconButton, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { useRef } from 'react'
import ReactDraggable from 'react-draggable'
import { MdCancel } from 'react-icons/md'

import { forceArray } from '../../utils'

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    cursor: 'move',
    zIndex: 2001,
    borderRadius: 1,
    border: '1px outset rgb(128 128 128)',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
}

const Draggable = ({
  component = Paper,
  sx = [],
  onClose,
  children,
  ...props
}) => {
  const nodeRef = useRef(null)
  return (
    <ReactDraggable bounds="parent" {...{ nodeRef, ...props }}>
      <Box
        ref={nodeRef}
        {...{ component }}
        elevation={7} // Only if `component` is `Paper`
        sx={[styles.root, ...forceArray(sx)]}
      >
        {children}
        <IconButton size="small" sx={styles.closeBtn} onClick={onClose}>
          <MdCancel />
        </IconButton>
      </Box>
    </ReactDraggable>
  )
}
Draggable.propTypes = {
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onClose: PropTypes.func,
  children: PropTypes.node,
}

export default Draggable
