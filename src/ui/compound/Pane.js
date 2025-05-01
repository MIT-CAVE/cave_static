import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { MdPushPin, MdOutlinePushPin } from 'react-icons/md'

import FetchedIcon from './FetchedIcon'

import { APP_BAR_WIDTH, PANE_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      height: '100%',
      overflow: 'hidden',
    },
  },
  content: {
    p: 2.5,
    height: '100%',
    boxSizing: 'border-box',
    maxWidth: `calc(100vw - ${2 * APP_BAR_WIDTH + 1}px)`,
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

const PaneRoot = ({
  disabled,
  elevation = 3,
  open,
  side,
  sx = [],
  ...props
}) => (
  <Drawer
    sx={[
      R.assocPath(
        ['& .MuiDrawer-paper', side],
        `${APP_BAR_WIDTH + 1}px`,
        styles.drawerPaper
      ),
      ...forceArray(sx),
    ]}
    anchor={side}
    variant={open ? 'permanent' : 'persistent'} // 'temporary'
    {...{ disabled, elevation, open, ...props }}
  />
)
PaneRoot.propTypes = {
  disabled: PropTypes.bool,
  elevation: PropTypes.oneOf([...Array(25).keys()]),
  open: PropTypes.bool,
  side: PropTypes.string,
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
  side,
  sx = [],
  ...props
}) => {
  const pinButton = (
    <IconButton
      sx={[
        styles.pinButton,
        leftButton && side === 'right' && { mr: 1.5 },
        rightButton && side === 'left' && { ml: 1.5 },
      ]}
      onClick={onPin}
    >
      {pin ? <MdPushPin /> : <MdOutlinePushPin />}
    </IconButton>
  )
  return (
    <Box sx={[styles.header, ...forceArray(sx)]} {...props}>
      {pin != null && side === 'right' && pinButton}
      <Box sx={styles.leftButton}>{leftButton}</Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <FetchedIcon {...{ iconName }} />
      </Stack>
      <Box sx={styles.rightButton}>{rightButton}</Box>
      {pin != null && side === 'left' && pinButton}
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
  side,
  width = 'auto',
  open,
  children,
  ...props
}) => (
  <PaneRoot open={!!open} side={side} {...props}>
    <PaneHeader
      title={name}
      {...{ iconName, leftButton, rightButton, pin, onPin, side }}
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
  side: PropTypes.string,
}

export { PaneHeader, PaneRoot }
export default Pane
