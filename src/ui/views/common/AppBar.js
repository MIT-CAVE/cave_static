import { Divider, IconButton, Tab, Tabs, alpha, Box } from '@mui/material'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchData } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import { viewSelection } from '../../../data/local/settingsSlice'
import {
  selectTheme,
  selectView,
  selectAppBarId,
  selectSync,
  selectGroupedAppBar,
  selectOpenPane,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { themeId, viewId } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import { sortProps, includesPath } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: `${APP_BAR_WIDTH}px`,
    borderRight: 1,
    borderColor: 'text.secondary',
    bgcolor: 'background.paper',
    zIndex: 1201,
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
  navBtn: {
    mt: 0.5,
    mb: 0.5,
    ml: 'auto',
    mr: 'auto',
    height: '2em',
    width: '2em',
  },
  navBtnActive: {
    border: 3,
    borderColor: 'text.primary',
    bgcolor: (theme) =>
      theme.palette.mode === themeId.DARK ? 'grey.600' : 'grey.400',
  },
}

const nonSx = {
  navIcon: {
    color: (theme) => theme.palette.text.primary,
  },
}

//Wrappers stop Tabs from passing props that cannot be read and cause errors
const ButtonInTabs = ({ icon, color, onClick, sx = [] }) => (
  <IconButton size="large" {...{ sx, onClick }}>
    <FetchedIcon size={35} color={color} iconName={icon} />
  </IconButton>
)

const getAppBarItem = ({
  obj,
  color,
  key,
  selectedView,
  appBarId,
  changePane,
  sync,
  dispatch,
}) => {
  const type = R.prop('type', obj)
  const icon = R.prop('icon', obj)
  const path = ['appBar', 'data', 'appBarId']
  return type === 'pane' ? (
    <Tab
      sx={styles.tab}
      key={key}
      value={key}
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
  ) : type === 'button' ? (
    <ButtonInTabs
      key={key}
      onClick={() => {
        dispatch(
          fetchData({
            url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
            httpMethod: 'POST',
            body: {
              api_command: R.prop('apiCommand')(obj),
            },
          })
        )
      }}
      icon={icon}
      color={color}
    />
  ) : type === 'map' ? (
    <ButtonInTabs
      {...{ key, icon, color }}
      sx={[
        styles.navBtn,
        selectedView === viewId.MAP && R.equals(appBarId, key)
          ? styles.navBtnActive
          : {},
      ]}
      onClick={() => {
        dispatch(
          mutateLocal({
            path,
            value: key,
            sync: !includesPath(R.values(sync), path),
          })
        )
        dispatch(viewSelection(viewId.MAP))
      }}
    />
  ) : type === 'kpi' ? (
    <ButtonInTabs
      {...{ key, icon, color }}
      sx={[
        styles.navBtn,
        selectedView === viewId.KPI ? styles.navBtnActive : {},
      ]}
      onClick={() => dispatch(viewSelection(viewId.KPI))}
    />
  ) : type === 'stats' ? (
    <ButtonInTabs
      {...{ key, icon, color }}
      sx={[
        styles.navBtn,
        selectedView === viewId.DASHBOARD && R.equals(appBarId, key)
          ? styles.navBtnActive
          : {},
      ]}
      onClick={() => {
        dispatch(
          mutateLocal({
            path,
            value: key,
            sync: !includesPath(R.values(sync), path),
          })
        )
        dispatch(viewSelection(viewId.DASHBOARD))
      }}
    />
  ) : (
    []
  )
}

const AppBar = () => {
  const dispatch = useDispatch()
  const selectedView = useSelector(selectView)
  const currentThemeId = useSelector(selectTheme)
  const open = useSelector(selectOpenPane)
  const appBar = useSelector(selectGroupedAppBar)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)

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
          path: ['appBar', 'paneState'],
          value: open === pane ? {} : { open: pane },
          sync: !includesPath(R.values(sync), ['appBar', 'paneState']),
        })
      )
    },
    [dispatch, sync, open]
  )

  return (
    <Box sx={styles.root}>
      <Tabs
        sx={[styles.navSection, { flexGrow: 1 }]}
        value={getValue('upper')}
        orientation="vertical"
        variant="fullWidth"
        aria-label="Upper App Bar"
      >
        {/* Upper Bar */}
        {R.values(
          R.mapObjIndexed((obj, key) => {
            const color = R.propOr(
              R.prop('color', obj),
              currentThemeId
            )(R.prop('color', obj))
            return getAppBarItem({
              color,
              key,
              obj,
              selectedView,
              appBarId,
              changePane,
              sync,
              dispatch,
            })
          })(sortProps(R.propOr({}, 'upper', appBar)))
        )}
      </Tabs>

      {/* Lower Bar */}
      {!R.isEmpty(R.propOr({}, 'lower', appBar)) && (
        <Divider sx={styles.divider} />
      )}
      <Tabs
        sx={styles.navSection}
        value={getValue('lower')}
        orientation="vertical"
        variant="fullWidth"
        aria-label="Lower App Bar"
      >
        {R.values(
          R.mapObjIndexed((obj, key) => {
            const color = R.propOr(
              R.prop('color', obj),
              currentThemeId
            )(R.prop('color', obj))
            return getAppBarItem({
              color,
              key,
              obj,
              selectedView,
              appBarId,
              changePane,
              sync,
              dispatch,
            })
          })(sortProps(R.propOr({}, 'lower', appBar)))
        )}
      </Tabs>
    </Box>
  )
}

export default AppBar
