import { Grid, IconButton, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { MdCancel } from 'react-icons/md'

import { forceArray } from '../../utils'

const styles = {
  root: {
    mx: 0.5,
    minWidth: '65px',
  },
  button: {
    top: 0,
    right: 0,
    position: 'absolute',
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.1)',
    },
  },
}

const HeaderSelectWrapper = ({
  sx = [],
  clearable = false,
  onClear = () => {},
  children,
  ...props
}) => {
  return (
    <Paper
      component={Grid}
      display="flex"
      item
      sx={[
        styles.root,
        clearable && { position: 'relative' },
        ...forceArray(sx),
      ]}
      elevation={3}
      {...props}
    >
      {children}
      {clearable && (
        <IconButton sx={styles.button} onClick={onClear}>
          <MdCancel fontSize="medium" />
        </IconButton>
      )}
    </Paper>
  )
}
HeaderSelectWrapper.propTypes = {
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  clearable: PropTypes.bool,
  onClear: PropTypes.func,
  children: PropTypes.node,
}

export default HeaderSelectWrapper
