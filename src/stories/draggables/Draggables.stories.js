import { Box } from '@mui/material'
import { configureStore } from '@reduxjs/toolkit'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { expect, waitFor, within } from 'storybook/test'

import { OverlayContainerContext } from '../../ui/draggables'
import DockBar from '../../ui/draggables/DockBar'
import Draggables from '../../ui/draggables/Draggables'
import GlobalOutputsDockedSection from '../../ui/draggables/GlobalOutputsDockedSection'
import GlobalOutputsDraggable from '../../ui/draggables/GlobalOutputsDraggable'
import MapNameDraggable from '../../ui/draggables/MapNameDraggable'
import NotificationsDraggable, {
  NotificationsUnhide,
} from '../../ui/draggables/NotificationsDraggable'
import SessionDockedSection from '../../ui/draggables/SessionDockedSection'
import SessionDraggable from '../../ui/draggables/SessionDraggable'
import TimeDockedSection from '../../ui/draggables/TimeDockedSection'
import TimeDraggable from '../../ui/draggables/TimeDraggable'
import Loader from '../../ui/views/common/Loader'
import { draggableId } from '../../utils/enums'

const mockStore = configureStore({
  reducer: {
    data: (
      state = {
        draggables: {
          data: {
            [draggableId.TIME]: {
              open: true,
              showDragHandle: true,
              docked: true,
            },
            [draggableId.SESSION]: {
              open: true,
              showDragHandle: true,
              docked: true,
            },
            [draggableId.GLOBAL_OUTPUTS]: {
              open: true,
              showDragHandle: true,
              docked: true,
            },
            [draggableId.MAP_NAMES]: { open: true, showDragHandle: true },
            [draggableId.NOTIFICATIONS]: { open: true, showDragHandle: true },
          },
        },
        settings: {
          time: {
            timeLength: 10,
            timeUnits: 'Days',
            looping: true,
            speed: 1,
          },
        },
        globalOutputs: {
          props: {
            kpi1: {
              type: 'num',
              name: 'Total Revenue',
              quickView: true,
              unit: '$',
              precision: 2,
              icon: 'md/MdTrendingUp',
              color: '#2e7d32',
            },
            kpi2: {
              type: 'num',
              name: 'Total Cost',
              quickView: true,
              unit: '$',
              precision: 2,
              icon: 'md/MdTrendingDown',
              color: '#c62828',
            },
            kpi3: {
              type: 'num',
              name: 'Net Margin',
              quickView: true,
              unit: '%',
              precision: 1,
              icon: 'md/MdPercent',
            },
            kpi4: {
              type: 'num',
              name: 'Units Shipped',
              quickView: true,
              precision: 0,
              icon: 'md/MdLocalShipping',
            },
            kpi5: {
              type: 'num',
              name: 'On-Time Delivery',
              quickView: true,
              unit: '%',
              precision: 1,
              icon: 'md/MdSchedule',
            },
            kpi6: {
              type: 'num',
              name: 'Active Vehicles',
              quickView: true,
              precision: 0,
              icon: 'md/MdLocalShipping',
            },
          },
          values: {
            kpi1: { value: 1250000 },
            kpi2: { value: 950000 },
            kpi3: { value: 24 },
            kpi4: { value: 18400 },
            kpi5: { value: 96.5 },
            kpi6: { value: 132 },
          },
        },
        maps: {
          data: {
            map_1: { name: 'San Francisco Logistics Grid' },
          },
        },
      }
    ) => state,
    local: (
      state = {
        draggables: {
          data: {},
        },
        settings: {
          time: {
            currentTime: 2,
            play: false,
          },
        },
      }
    ) => state,
    utilities: (
      state = {
        // Only matters to stories that render the `Loader`
        loading: { session_loading: true, data_loading: false },
        sessions: {
          session_id: 'session_1',
          data: {
            team_1: {
              teamId: 'team_1',
              teamName: 'Team Alpha',
              sessions: {
                session_1: {
                  sessionId: 'session_1',
                  sessionName: 'Production Run A',
                },
                session_2: {
                  sessionId: 'session_2',
                  sessionName: 'Scenario Planning B',
                },
              },
            },
          },
        },
        messages: {
          msg1: {
            snackbarType: 'error',
            message: 'Connection to server lost. Retrying...',
          },
          msg2: { snackbarType: 'warning', message: 'Low memory warning.' },
        },
      }
    ) => state,
  },
})

const reduxDecorator = (Story) => (
  <Provider store={mockStore}>
    <Story />
  </Provider>
)

const fullHeightDecorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      boxSizing: 'border-box',
    }}
  >
    <Story />
  </div>
)

const draggablesStories = {
  title: 'Draggables',
  decorators: [reduxDecorator, fullHeightDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default draggablesStories

export const Time = {
  render: () => <TimeDraggable />,
}

export const Session = {
  render: () => <SessionDraggable />,
}

export const GlobalOutputs = {
  render: () => <GlobalOutputsDraggable />,
}

export const DockBarAggregator = {
  render: () => <DockBar />,
}

export const SessionDocked = {
  render: () => <SessionDockedSection />,
  parameters: {
    layoutWidth: '400px',
  },
}

export const TimeDocked = {
  render: () => <TimeDockedSection />,
  parameters: {
    layoutWidth: '400px',
  },
}

export const GlobalOutputsDocked = {
  render: () => <GlobalOutputsDockedSection />,
  parameters: {
    layoutWidth: '400px',
  },
}

export const MapName = {
  render: () => <MapNameDraggable mapId="map_1" />,
}

export const Notifications = {
  render: () => <NotificationsDraggable />,
}

export const NotificationsUnhideButton = {
  render: () => <NotificationsUnhide />,
}

// Mirrors the layout in `App.js`: the Loader backdrop, a pass-through overlay
// above it, and a `contain: 'layout'` workspace (its own stacking context)
// holding the draggables and the rest of the app.
const LoadingLayout = () => {
  const [overlay, setOverlay] = useState(null)
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Loader />
      <Box
        ref={setOverlay}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 2001,
          pointerEvents: 'none',
          contain: 'layout',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          contain: 'layout',
          flex: '1 1 auto',
        }}
      >
        <Box data-testid="dashboard" sx={{ height: '100%' }} />
        <OverlayContainerContext value={overlay}>
          <Draggables />
        </OverlayContainerContext>
      </Box>
    </Box>
  )
}

// Server notifications must stay reachable while the app waits on the server
export const NotificationsWhileLoading = {
  render: () => <LoadingLayout />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hitAt = (element) => {
      const { left, top } = element.getBoundingClientRect()
      return document.elementFromPoint(left + 4, top + 4)
    }

    // The Loader opens after a short delay
    const backdrop = await waitFor(() => {
      const element = document.querySelector('.MuiBackdrop-root')
      expect(element).not.toBeNull()
      expect(getComputedStyle(element).visibility).toBe('visible')
      return element
    })

    // The notifications are not covered by the backdrop...
    const [closeButton] = await canvas.findAllByRole('button', {
      name: 'close',
    })
    expect(closeButton.contains(hitAt(closeButton))).toBe(true)

    // ...while the rest of the app still is
    expect(backdrop.contains(hitAt(canvas.getByTestId('dashboard')))).toBe(true)
  },
}
