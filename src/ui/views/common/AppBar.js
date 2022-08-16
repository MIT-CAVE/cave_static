/** @jsxImportSource @emotion/react */
import { Divider, IconButton, Tab, Tabs, alpha } from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchData } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import { viewSelection } from '../../../data/local/settingsSlice'
import {
  selectTheme,
  selectView,
  selectDashboardId,
  selectSync,
  selectGroupedAppBar,
  selectOpenPane,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { themeId, viewId } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import { sortProps, includesPath } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: `${APP_BAR_WIDTH}px`,
    zIndex: 1201,
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.text.secondary}`,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(1, 0),
  },
  divider: {
    height: '2px',
    margin: theme.spacing(1, 0),
  },
  navIcon: {
    color: theme.palette.text.primary,
  },
  tab: {
    minWidth: `${APP_BAR_WIDTH}px`,
    marginBottom: theme.spacing(1),
    '&:hover': {
      backgroundColor: alpha(
        theme.palette.action.active,
        theme.palette.action.hoverOpacity
      ),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  navBtn: {
    margin: theme.spacing(0.5, 0),
    width: '2em',
    height: '2em',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  navBtnActive: {
    border: `3px solid ${theme.palette.text.primary}`,
    backgroundColor:
      theme.palette.mode === themeId.DARK
        ? theme.palette.grey[600]
        : theme.palette.grey[400],
  },
}))

//Wrappers stop Tabs from passing props that cannot be read and cause errors
const ButtonInTabs = ({ icon, color, onClick, className = '' }) => (
  <IconButton onClick={onClick} size="large" className={className}>
    <FetchedIcon size={35} color={color} iconName={icon} />
  </IconButton>
)

const getAppBarItem = ({
  obj,
  color,
  key,
  classes,
  selectedView,
  dashboardId,
  changePane,
  sync,
  dispatch,
}) => {
  const type = R.prop('type', obj)
  const icon = R.prop('icon', obj)

  const path = ['appBar', 'data', 'dashboardId']

  return type === 'pane' ? (
    <Tab
      className={classes.tab}
      key={key}
      value={key}
      icon={
        <FetchedIcon
          className={classes.navIcon}
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
      key={key}
      className={`${classes.navBtn} ${
        selectedView === viewId.MAP ? classes.navBtnActive : ''
      }`}
      onClick={() => dispatch(viewSelection(viewId.MAP))}
      icon={icon}
      color={color}
    />
  ) : type === 'kpi' ? (
    <ButtonInTabs
      key={key}
      className={`${classes.navBtn} ${
        selectedView === viewId.KPI ? classes.navBtnActive : ''
      }`}
      onClick={() => dispatch(viewSelection(viewId.KPI))}
      icon={icon}
      color={color}
    />
  ) : type === 'stats' ? (
    <ButtonInTabs
      key={key}
      className={`${classes.navBtn} ${
        selectedView === viewId.DASHBOARD && R.equals(dashboardId, key)
          ? classes.navBtnActive
          : ''
      }`}
      icon={icon}
      color={color}
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
  const classes = useStyles()
  const selectedView = useSelector(selectView)
  const currentThemeId = useSelector(selectTheme)
  const open = useSelector(selectOpenPane)
  const appBar = useSelector(selectGroupedAppBar)
  const dashboardId = useSelector(selectDashboardId)
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
    <>
      <div className={classes.root}>
        <Tabs
          className={classes.navSection}
          css={{ flexGrow: 1 }}
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
                classes,
                obj,
                selectedView,
                dashboardId,
                changePane,
                sync,
                dispatch,
              })
            })(sortProps(R.propOr({}, 'upper', appBar)))
          )}
        </Tabs>

        {/* Lower Bar */}
        {!R.isEmpty(R.propOr({}, 'lower', appBar)) && (
          <Divider className={classes.divider} />
        )}
        <Tabs
          className={classes.navSection}
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
                classes,
                obj,
                selectedView,
                dashboardId,
                changePane,
                sync,
                dispatch,
              })
            })(sortProps(R.propOr({}, 'lower', appBar)))
          )}
        </Tabs>
      </div>
    </>
  )
}

export default AppBar
