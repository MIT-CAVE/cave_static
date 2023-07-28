import { Box, Drawer, IconButton } from '@mui/material'
import PropTypes from 'prop-types'

import FetchedIcon from './FetchedIcon'

import { APP_BAR_WIDTH, PANE_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      left: `${APP_BAR_WIDTH + 1}px`,
      height: '100%',
      overflow: 'hidden',
    },
  },
  content: {
    p: 2.5,
    height: '100%',
    boxSizing: 'border-box',
    maxWidth: `calc(100vw - ${APP_BAR_WIDTH + 1}px)`,
    overflow: 'auto',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    p: 2.5,
    fontSize: '25px',
    borderColor: 'text.secondary',
    borderBottom: '2px',
  },
  title: {
    ml: 0.5,
    mr: 0.5,
  },
  leftButton: {
    ml: 0.5,
    mr: 'auto',
  },
  rightButton: {
    ml: 'auto',
    mr: 0.5,
  },
  pinButton: {
    p: 0.5,
    border: 'none',
    pointerEvents: '',
  },
}

const PaneRoot = ({ disabled, elevation = 3, open, sx = [], ...props }) => (
  <Drawer
    sx={[styles.drawer, ...forceArray(sx)]}
    anchor="left"
    variant={open ? 'permanent' : 'persistent'} // 'temporary'
    {...{ disabled, elevation, open, ...props }}
  />
)
PaneRoot.propTypes = {
  disabled: PropTypes.bool,
  elevation: PropTypes.oneOf([...Array(25).keys()]),
  open: PropTypes.bool,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

const PaneHeader = ({
  title,
  iconName,
  leftButton,
  rightButton,
  pin,
  onPin,
  sx = [],
  ...props
}) => {
  const icon = <FetchedIcon {...{ iconName }} />
  return (
    <Box sx={[styles.header, ...forceArray(sx)]} {...props}>
      <Box sx={styles.leftButton}>{leftButton}</Box>
      <Box sx={styles.title}>
        {title} {icon}
      </Box>
      <Box sx={styles.rightButton}>{rightButton}</Box>
      {pin != null && (
        <IconButton
          sx={[styles.pinButton, rightButton && { ml: 1.5 }]}
          onClick={onPin}
        >
          <FetchedIcon
            iconName={pin ? 'md/MdPushPin' : 'md/MdOutlinePushPin'}
          />
        </IconButton>
      )}
    </Box>
  )
}
PaneHeader.propTypes = {
  title: PropTypes.string,
  iconName: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  rightButton: PropTypes.node,
  leftButton: PropTypes.node,
  pin: PropTypes.bool,
  onPin: PropTypes.func,
}

const Pane = ({
  name,
  iconName,
  leftButton,
  rightButton,
  pin,
  onPin,
  width = 'auto',
  open,
  children,
  ...props
}) => (
  <PaneRoot open={!!open} {...props}>
    <PaneHeader
      title={name}
      {...{ iconName, leftButton, rightButton, pin, onPin }}
    />
    <Box sx={[{ minWidth: PANE_WIDTH, width }, styles.content]}>
      <Box sx={{ minWidth: 'max-content' }}>{children}</Box>
    </Box>
  </PaneRoot>
)
Pane.propTypes = {
  name: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
}

export { PaneHeader, PaneRoot }
export default Pane
