import './App.css'
import { ThemeProvider, Box, createTheme } from '@mui/material'
import { StyledEngineProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import * as R from 'ramda'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import {
  selectCurrentPage,
  selectAppBarData,
  selectDemoMode,
  selectDemoViews,
  selectDemoSettings,
} from './data/selectors'
import { ErrorBoundary } from './ui/compound'
import AppBar from './ui/views/common/AppBar'
import Draggables from './ui/views/common/Draggables'
import Loader from './ui/views/common/Loader'
import { AppModal } from './ui/views/common/Modal'
import Panes from './ui/views/common/Panes'
import renderAppPane from './ui/views/common/renderAppPane'
import SnackBar from './ui/views/common/SnackBar'
import VirtualKeyboard from './ui/views/common/VirtualKeyboard'
import Dashboard from './ui/views/dashboard/Dashboard'
import { paneId } from './utils/enums'
import { useMutateStateWithSync } from './utils/hooks'

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    bgcolor: 'background.paper',
    overflow: 'hidden',
  },
  page: {
    label: 'workspace',
    position: 'relative',
    flex: '1 1 auto',
  },
  pane: {
    display: 'flex',
    position: 'absolute',
    height: '100vh',
    top: 0,
  },
}

const App = () => {
  const currentPage = useSelector(selectCurrentPage)
  const appBarData = useSelector(selectAppBarData)
  const appBarViews = useSelector(selectDemoViews)
  const demoMode = useSelector(selectDemoMode)
  const demoSettings = useSelector(selectDemoSettings)

  const demoTimeout = useRef(-1)

  const updateCurrentPage = useMutateStateWithSync(
    (nextViewIndex) => {
      demoTimeout.current = -1
      return {
        path: ['pages', 'currentPage'],
        value: appBarViews[isNaN(nextViewIndex) ? 0 : nextViewIndex],
      }
    },
    [appBarViews]
  )

  useEffect(() => {
    if (demoMode && demoTimeout.current === -1) {
      const nextViewIndex =
        (R.findIndex(R.equals(currentPage), appBarViews) + 1) %
        R.length(appBarViews)
      demoTimeout.current = setTimeout(
        updateCurrentPage(nextViewIndex),
        R.pathOr(15, [currentPage, 'displayTime'], demoSettings) * 1000
      )
    } else if (demoTimeout.current !== -1 && !demoMode) {
      clearTimeout(demoTimeout.current)
      demoTimeout.current = -1
    }
    return () => {
      if (demoTimeout.current !== -1) {
        clearTimeout(demoTimeout.current)
        demoTimeout.current = -1
      }
    }
  }, [
    appBarData,
    currentPage,
    appBarViews,
    demoMode,
    demoSettings,
    updateCurrentPage,
  ])

  // TODO: Handle when Session pane is not defined
  const SessionPane = (
    <Box sx={styles.pane}>
      {renderAppPane({
        side: 'left',
        open: paneId.SESSION,
        pane: {
          icon: 'md/MdApi',
          name: 'Sessions Pane',
          variant: paneId.SESSION,
        },
      })}
    </Box>
  )

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        theme={createTheme({
          palette: {
            mode: 'dark',
            greyscale: {
              main: '#f2f4f9',
              light: '#99a0b4',
              dark: '#373b47',
              contrastText: '#000000',
            },
            background: {
              paper: '#4a4a4a',
            },
            DataGrid: {
              bg: '#4a4a4a',
              // headerBg: '#353535',
            },
          },
          components: {
            MuiDataGrid: {
              styleOverrides: {
                root: {
                  borderColor: 'rgb(128 128 128 / .4)',
                  '.MuiDataGrid-withBorderColor': {
                    borderColor: 'rgb(128 128 128 / .4)',
                  },
                  // 'MuiDataGrid-filler': {
                  //   backgroundColor: '#353535',
                  // },
                  // // Fixes MUI style bug in horizontal scroll bar
                  // '.MuiDataGrid-scrollbar--horizontal': {
                  //   display: 'block',
                  // },
                },
              },
            },
          },
          typography: {
            fontFamily: 'inherit',
          },
        })}
      >
        <Box sx={styles.root}>
          <SnackBar />
          <AppBar side="left" />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={styles.page}>
              <Loader />

              <ErrorBoundary fallback={SessionPane}>
                <Dashboard />
                <Panes />
                <AppModal />
              </ErrorBoundary>
            </Box>
            <Draggables />
          </LocalizationProvider>
          <AppBar side="right" />
        </Box>
        <VirtualKeyboard />
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
