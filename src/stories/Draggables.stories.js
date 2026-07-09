import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import GlobalOutputsDraggable from '../ui/draggables/GlobalOutputsDraggable'
import MapNameDraggable from '../ui/draggables/MapNameDraggable'
import NotificationsDraggable, {
  NotificationsUnhide,
} from '../ui/draggables/NotificationsDraggable'
import SessionDraggable from '../ui/draggables/SessionDraggable'
import TimeDraggable from '../ui/draggables/TimeDraggable'
import { draggableId } from '../utils/enums'

const mockStore = configureStore({
  reducer: {
    data: (
      state = {
        draggables: {
          data: {
            [draggableId.TIME]: { open: true, showDragHandle: true },
            [draggableId.SESSION]: { open: true, showDragHandle: true },
            [draggableId.GLOBAL_OUTPUTS]: { open: true, showDragHandle: true },
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
              draggable: true,
              unit: '$',
              precision: 2,
              icon: 'md/MdTrendingUp',
            },
            kpi2: {
              type: 'num',
              name: 'Total Cost',
              draggable: true,
              unit: '$',
              precision: 2,
              icon: 'md/MdTrendingDown',
            },
          },
          values: {
            kpi1: { value: 1250000 },
            kpi2: { value: 950000 },
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

export const MapName = {
  render: () => <MapNameDraggable mapId="map_1" />,
}

export const Notifications = {
  render: () => <NotificationsDraggable />,
}

export const NotificationsUnhideButton = {
  render: () => <NotificationsUnhide />,
}
