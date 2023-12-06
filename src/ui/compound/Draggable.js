import { Box, IconButton, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import ReactDraggable from 'react-draggable'
import { MdOutlineClose } from 'react-icons/md'

import { forceArray } from '../../utils'

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    cursor: 'move',
    zIndex: 5000,
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
  return (
    <ReactDraggable bounds="parent" {...props}>
      <Box
        {...{ component }}
        elevation={7}
        sx={[styles.root, ...forceArray(sx)]}
      >
        {children}
        <IconButton sx={styles.closeBtn} onClick={onClose}>
          <MdOutlineClose />
        </IconButton>
      </Box>
    </ReactDraggable>
  )
}
Draggable.propTypes = {
  component: PropTypes.node,
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
