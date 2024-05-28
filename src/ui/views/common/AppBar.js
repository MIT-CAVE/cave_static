import { Divider, IconButton, Tab, Tabs, alpha, Box } from '@mui/material'
import * as R from 'ramda'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectCurrentPage,
  selectSync,
  selectPanesData,
  selectSessionLoading,
  selectIgnoreLoading,
  selectDataLoading,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { paneId } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import { forceArray, includesPath } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: `${APP_BAR_WIDTH}px`,
    borderColor: 'text.secondary',
    bgcolor: 'background.paper',
  },
  rightRoot: {
    position: 'absolute',
    right: 0,
    borderLeft: 1,
  },
  leftRoot: {
    borderRight: 1,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    pt: 1,
    pb: 1,
  },
  divider: {
    height: '2px',
    mt: 1,
    mb: 1,
  },
  tab: {
    minWidth: `${APP_BAR_WIDTH}px`,
    mb: 1,
    '&:hover': (theme) => ({
      bgcolor: alpha(
        theme.palette.action.active,
        theme.palette.action.hoverOpacity
      ),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        bgcolor: 'transparent',
      },
    }),
  },
  tabBtn: {
    alignSelf: 'center',
  },
  navBtn: {
    my: 0.5,
    height: '2em',
    width: '2em',
  },
  navBtnActive: {
    border: 3,
    borderColor: 'text.primary',
    bgcolor: 'grey.600',
  },
}

const nonSx = {
  navIcon: {
    color: (theme) => theme.palette.text.primary,
  },
}

//Wrappers stop Tabs from passing props that cannot be read and cause errors
const ButtonInTabs = ({ icon, color, disabled, onClick, sx = [] }) => (
  <IconButton
    size="large"
    sx={[styles.tabBtn, ...forceArray(sx)]}
    {...{ onClick, disabled }}
  >
    <FetchedIcon size={35} color={color} iconName={icon} />
  </IconButton>
)

const getAppBarItem = ({
  obj,
  color,
  key,
  pin,
  currentPage,
  changePane,
  sync,
  loading,
  dispatch,
}) => {
  const type = R.prop('type', obj)
  const icon = R.prop('icon', obj)
  const variant = R.prop('variant', obj)
  const path = ['pages', 'currentPage']

  return type === paneId.SESSION ? (
    <Tab
      sx={styles.tab}
      key={key}
      value={key}
      disabled={loading}
      icon={
        <FetchedIcon
          className={nonSx.navIcon}
          size={25}
          color={color}
          iconName={icon}
        />
      }
      onClick={() => {
        changePane(key)
      }}
    />
  ) : type === paneId.APP_SETTINGS ? (
    <Tab
      sx={styles.tab}
      key={key}
      value={key}
      disabled={loading}
      icon={
        <FetchedIcon
          className={nonSx.navIcon}
          size={25}
          color={color}
          iconName={icon}
        />
      }
      onClick={() => {
        changePane(key)
      }}
    />
  ) : type === 'pane' ? (
    variant === 'modal' ? (
      <ButtonInTabs
        key={key}
        {...{ icon, color }}
        disabled={loading}
        onClick={() => {
          dispatch(
            mutateLocal({
              path: ['panes', 'paneState', 'center'],
              value: { open: key, type: 'pane' },
              sync: !includesPath(R.values(sync), [
                'panes',
                'paneState',
                'center',
              ]),
            })
          )
        }}
      />
    ) : (
      // default panes to wall
      <Tab
        sx={styles.tab}
        key={key}
        value={key}
        disabled={loading}
        icon={
          <FetchedIcon
            className={nonSx.navIcon}
            size={25}
            color={color}
            iconName={icon}
          />
        }
        onClick={() => {
          changePane(key)
        }}
      />
    )
  ) : type === 'button' ? (
    <ButtonInTabs
      key={key}
      {...{ icon, color }}
      disabled={loading}
      onClick={() => {
        dispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              api_command: R.prop('apiCommand')(obj),
              api_command_keys: R.prop('apiCommandKeys')(obj),
              data_name: R.prop('dataName')(obj),
              data_path: R.prop('dataPath')(obj),
              data_value: R.prop('dataValue')(obj),
            },
          })
        )
      }}
    />
  ) : type === 'page' ? (
    <ButtonInTabs
      key={key}
      {...{ icon, color }}
      disabled={loading}
      sx={[
        styles.navBtn,
        R.equals(currentPage, key) ? styles.navBtnActive : {},
      ]}
      onClick={() => {
        dispatch(
          mutateLocal({
            path,
            value: key,
            sync: !includesPath(R.values(sync), path),
          })
        )
        // Automatically close an unpinned pane when switching
        // to a different page
        if (!pin && key !== currentPage) changePane()
      }}
    />
  ) : (
    []
  )
}

const AppBar = ({ appBar, open, pin, side, source }) => {
  const dispatch = useDispatch()
  const currentPage = useSelector(selectCurrentPage)
  const panesData = useSelector(selectPanesData)
  const sessionLoading = useSelector(selectSessionLoading)
  const dataLoading = useSelector(selectDataLoading)
  const ignoreLoading = useSelector(selectIgnoreLoading)
  const sync = useSelector(selectSync)

  const waitTimeout = useRef(0)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    // show for ignoreloading
    if (ignoreLoading) setLoading(true)
    // start a timer if other loadings
    else if (dataLoading || sessionLoading) {
      if (waitTimeout.current === 0)
        waitTimeout.current = setTimeout(() => setLoading(true), 250)
    } else {
      // if loadings false, clear timer
      if (waitTimeout.current !== 0) {
        clearTimeout(waitTimeout.current)
        waitTimeout.current = 0
      }
      // and close loader
      if (loading) setLoading(false)
    }
    // cleanup timer on unmount
    return () => {
      if (waitTimeout.current !== 0) {
        clearTimeout(waitTimeout.current)
        waitTimeout.current = 0
      }
    }
  }, [dataLoading, ignoreLoading, loading, sessionLoading])

  const getValue = useCallback(
    (key) =>
      R.pipe(
        R.prop(key),
        R.keys,
        R.ifElse(R.includes(open), R.always(open), R.F)
      )(appBar),
    [appBar, open]
  )

  const changePane = useCallback(
    (pane) => {
      dispatch(
        mutateLocal({
          path: ['panes', 'paneState', side],
          value: {
            pin, // Preserves state of a pinned pane
            ...(open === pane ? {} : { open: pane }),
          },
          sync: !includesPath(R.values(sync), ['panes', 'paneState', side]),
        })
      )
    },
    [dispatch, sync, open, pin, side]
  )

  const mapAppBarItems = R.pipe(
    R.mapObjIndexed((obj, key) => {
      const color = R.prop('color', obj)
      const variant = R.pathOr(false, [key, 'variant'], panesData)
      const disabled = R.equals(variant, paneId.SESSION) ? false : loading
      return getAppBarItem({
        color,
        key,
        pin,
        obj,
        currentPage,
        changePane,
        sync,
        loading: disabled,
        dispatch,
      })
    }),
    R.values
  )
  const capitalizedSide = R.replace(source[0], R.toUpper(source[0]), source)
  const lowerKey = `lower${capitalizedSide}`
  const upperKey = `upper${capitalizedSide}`
  return (
    <Box
      sx={[side === 'right' ? styles.rightRoot : styles.leftRoot, styles.root]}
    >
      <Tabs
        sx={[
          styles.navSection,
          { flexGrow: 1 },
          side === 'right' && {
            '.MuiTabs-indicator': {
              left: 0,
            },
          },
        ]}
        value={getValue(upperKey)}
        orientation="vertical"
        variant="fullWidth"
        aria-label="Upper App Bar"
      >
        {/* Upper Bar */}
        {mapAppBarItems(R.propOr({}, upperKey, appBar))}
      </Tabs>

      {/* Lower Bar */}
      {!R.isEmpty(R.propOr({}, lowerKey, appBar)) && (
        <Divider sx={styles.divider} />
      )}
      <Tabs
        sx={styles.navSection}
        value={getValue(lowerKey)}
        orientation="vertical"
        variant="fullWidth"
        aria-label="Lower App Bar"
      >
        {mapAppBarItems(R.propOr({}, lowerKey, appBar))}
      </Tabs>
    </Box>
  )
}

export default AppBar
