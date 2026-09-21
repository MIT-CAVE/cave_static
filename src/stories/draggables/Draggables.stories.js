import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import DockBar from '../../ui/draggables/DockBar'
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
