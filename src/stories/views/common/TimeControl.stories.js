import React from 'react'

import TimeControl from '../../../ui/views/common/TimeControl'

const timeControlStories = {
  title: 'Views/Common/TimeControl',
  component: TimeControl,
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '150px',
  },
}

export default timeControlStories

export const Default = {
  render: () => <TimeControl />,
  parameters: {
    preloadedState: {
      data: {
        settings: {
          time: {
            timeLength: 10,
            timeUnits: 'Days',
            looping: true,
            speed: 1,
          },
        },
      },
      local: {
        settings: {
          time: {
            currentTime: 4,
            play: false,
          },
        },
      },
    },
  },
}

export const Playing = {
  render: () => <TimeControl />,
  parameters: {
    preloadedState: {
      data: {
        settings: {
          time: {
            timeLength: 20,
            timeUnits: 'Hours',
            looping: false,
            speed: 2,
          },
        },
      },
      local: {
        settings: {
          time: {
            currentTime: 12,
            play: true,
          },
        },
      },
    },
  },
}
