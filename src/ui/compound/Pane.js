import { Box, Drawer } from '@mui/material'
import PropTypes from 'prop-types'

import FetchedIcon from './FetchedIcon'

import { APP_BAR_WIDTH, PANE_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  titleDiv: {
    fontSize: '25px',
    borderColor: 'text.secondary',
    borderBottom: '2px',
    pb: 2,
    mb: 3,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  titleText: {
    ml: 0.5,
    mr: 0.5,
  },
  rightButton: {
    ml: 'auto',
    mr: 0.5,
  },
  leftButton: {
    ml: 0.5,
    mr: 'auto',
  },
}

const getDrawerStyle = (width) => ({
  '& .MuiDrawer-paper': (theme) => ({
    width,
    maxWidth: `calc(100vw - ${APP_BAR_WIDTH + 1}px - ${theme.spacing(5)})`,
    left: `${APP_BAR_WIDTH + 1}px`,
    height: `calc(100vh - ${theme.spacing(5)})`,
    p: 2.5,
    overflow: 'hidden',
  }),
})

const PaneRoot = ({
  disabled,
  elevation,
  open,
  width = PANE_WIDTH,
  sx = [],
  ...props
}) => (
  <Drawer
    sx={[getDrawerStyle(width), ...forceArray(sx)]}
    anchor="left"
    variant={open ? 'permanent' : 'persistent'} // "persistent"
    {...{ disabled, elevation, open, ...props }}
  />
)
PaneRoot.propTypes = {
  disabled: PropTypes.bool,
  elevation: PropTypes.oneOf([...Array(25).keys()]),
  open: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  children: PropTypes.node,
}

const PaneHeader = ({
  title,
  iconName,
  leftButton,
  rightButton,
  sx = [],
  ...props
}) => {
  const icon = <FetchedIcon {...{ iconName }} />
  return (
    <Box sx={[styles.titleDiv, ...forceArray(sx)]} {...props}>
      <Box sx={styles.leftButton}>{leftButton}</Box>
      <Box sx={styles.titleText}>
        {title} {icon}
      </Box>
      <Box sx={styles.rightButton}>{rightButton}</Box>
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
}

const Pane = ({
  name,
  iconName,
  leftButton,
  rightButton,
  open,
  children,
  ...props
}) => (
  <PaneRoot open={!!open} {...props}>
    <PaneHeader title={name} {...{ iconName, leftButton, rightButton }} />
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <Box sx={{ minWidth: 'max-content' }}>{children}</Box>
    </Box>
  </PaneRoot>
)
Pane.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node,
}

export { PaneHeader, PaneRoot }
export default Pane
