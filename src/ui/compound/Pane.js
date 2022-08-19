import { Box, Drawer } from '@mui/material'
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
    maxWidth: (theme) =>
      `calc(100vw - ${APP_BAR_WIDTH + 1}px - ${theme.spacing(5)})`,
    overflow: 'auto',
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
  width = PANE_WIDTH,
  open,
  children,
  ...props
}) => (
  <PaneRoot open={!!open} {...props}>
    <PaneHeader title={name} {...{ iconName, leftButton, rightButton }} />
    <Box sx={[{ width }, styles.content]}>
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
