import { Grid, IconButton, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { Children } from 'react'
import { MdCancel } from 'react-icons/md'
import { useSelector } from 'react-redux'

import { selectIsMaximized } from '../../../data/selectors'

import { addExtraProps, forceArray } from '../../../utils'

const styles = {
  root: {
    mx: 0.5,
    minWidth: '64px',
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

const ChartDropdownWrapper = ({
  sx = [],
  clearable = false,
  onClear = () => {},
  menuProps,
  children,
  ...props
}) => {
  const isMaximized = useSelector(selectIsMaximized)
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
      {addExtraProps(Children.only(children), {
        MenuProps: {
          sx: {
            '.MuiMenu-paper': {
              maxHeight: isMaximized ? 'calc(100% - 88px)' : 'calc(50% - 88px)',
            },
          },
          ...menuProps,
        },
      })}
      {clearable && (
        <IconButton sx={styles.button} onClick={onClear}>
          <MdCancel fontSize="medium" />
        </IconButton>
      )}
    </Paper>
  )
}
ChartDropdownWrapper.propTypes = {
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

export default ChartDropdownWrapper
