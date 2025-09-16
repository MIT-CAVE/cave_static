import { Box, Divider, IconButton, Tab, Tabs, capitalize } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import useAppBar from './useAppBar'

import { sendCommand } from '../../../data/data'
import {
  selectCurrentPage,
  selectSessionLoading,
  selectIgnoreLoading,
  selectDataLoading,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { paneId } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'

import { FetchedIcon } from '../../compound'

import { forceArray } from '../../../utils'

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
      bgcolor: `color-mix(in srgb, ${theme.palette.action.active}, transparent 90%)`,
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

const renderAppBarItem = ({
  itemKey,
  itemData,
  loading,
  currentPage,
  handleChangePage,
  handleChangePane,
  handleClickButton,
  handleOpenModal,
}) => {
  const { type, variant, icon, color } = itemData
  return itemKey === paneId.SESSION || itemKey === paneId.APP_SETTINGS ? (
    <Tab
      sx={styles.tab}
      key={itemKey}
      value={itemKey}
      disabled={itemKey === paneId.SESSION ? false : loading}
      icon={<FetchedIcon size={25} color={color} iconName={icon} />}
      onClick={() => handleChangePane(itemKey)}
    />
  ) : type === 'pane' ? (
    variant === 'modal' ? (
      <ButtonInTabs
        key={itemKey}
        {...{ icon, color }}
        disabled={loading}
        onClick={() => handleOpenModal(itemKey)}
      />
    ) : (
      // default panes to wall
      <Tab
        sx={styles.tab}
        key={itemKey}
        value={itemKey}
        disabled={loading}
        icon={<FetchedIcon size={25} color={color} iconName={icon} />}
        onClick={() => handleChangePane(itemKey)}
      />
    )
  ) : type === 'button' ? (
    <ButtonInTabs
      key={itemKey}
      {...{ icon, color }}
      disabled={loading}
      onClick={() => handleClickButton(itemData)}
    />
  ) : type === 'page' ? (
    <ButtonInTabs
      key={itemKey}
      {...{ icon, color }}
      disabled={loading}
      sx={[styles.navBtn, itemKey === currentPage && styles.navBtnActive]}
      onClick={() => handleChangePage(itemKey)}
    />
  ) : null
}

const AppBar = ({ side }) => {
  const sessionLoading = useSelector(selectSessionLoading)
  const dataLoading = useSelector(selectDataLoading)
  const ignoreLoading = useSelector(selectIgnoreLoading)
  const { appBar, open, source, pin } = useAppBar(side)
  const dispatch = useDispatch()
  const currentPage = useSelector(selectCurrentPage)

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

  const handleOpenModal = useMutateStateWithSync(
    (value) => ({
      path: ['panes', 'paneState', 'center'],
      value: { open: value, type: 'pane' },
    }),
    []
  )

  const handleChangePane = useMutateStateWithSync(
    (value) => ({
      path: ['panes', 'paneState', side],
      value: {
        pin, // Preserves state of a pinned pane
        ...(open === value ? {} : { open: value }),
      },
    }),
    [open, pin, side]
  )

  const handleClickButton = useCallback(
    (itemData) => {
      dispatch(
        sendCommand({
          command: 'mutate_session',
          data: {
            api_command: itemData.apiCommand,
            api_command_keys: itemData.apiCommandKeys,
            data_name: itemData.dataName,
            data_path: itemData.dataPath,
            data_value: itemData.dataValue,
          },
        })
      )
    },
    [dispatch]
  )

  const handleChangePage = useMutateStateWithSync(
    (value) => {
      // Close an unpinned pane when switching to a different page
      if (!pin && value !== currentPage) handleChangePane()
      return { path: ['pages', 'currentPage'], value }
    },
    [currentPage, pin]
  )

  const renderAppBarSection = useCallback(
    (sectionKey) =>
      R.pipe(
        R.propOr({}, sectionKey),
        R.mapObjIndexed((itemData, itemKey) =>
          renderAppBarItem({
            itemKey,
            itemData,
            loading,
            currentPage,
            handleChangePage,
            handleChangePane,
            handleClickButton,
            handleOpenModal,
          })
        ),
        R.values
      )(appBar),
    [
      appBar,
      currentPage,
      handleChangePage,
      handleChangePane,
      handleClickButton,
      handleOpenModal,
      loading,
    ]
  )

  const capitalizedSide = capitalize(source)
  const lowerKey = `lower${capitalizedSide}`
  const upperKey = `upper${capitalizedSide}`
  return (
    <Box
      sx={[side === 'left' ? styles.leftRoot : styles.rightRoot, styles.root]}
    >
      <Tabs
        sx={[
          styles.navSection,
          { flexGrow: 1 },
          side === 'right' && {
            '.MuiTabs-indicator': { left: 0 },
          },
        ]}
        value={getValue(upperKey)}
        orientation="vertical"
        variant="fullWidth"
      >
        {renderAppBarSection(upperKey)}
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
      >
        {renderAppBarSection(lowerKey)}
      </Tabs>
    </Box>
  )
}

export default AppBar
