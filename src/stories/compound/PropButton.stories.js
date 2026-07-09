import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import {
  PropButtonFilled,
  PropButtonOutlined,
  PropButtonText,
  PropButtonIcon,
} from '../../ui/compound/PropButton'

const mockStore = configureStore({
  reducer: {
    data: (
      state = {
        settings: {
          iconUrl: undefined,
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

const propButtonStories = {
  title: 'Compound/PropButton',
  component: PropButtonFilled,
  decorators: [reduxDecorator],
}

export default propButtonStories

export const Filled = {
  render: (args) => <PropButtonFilled {...args} />,
  args: {
    prop: {
      enabled: true,
      name: 'Click Me (Name)',
      value: 'Contained Button',
      color: '#1976d2',
      startIcon: 'md/MdSend',
      endIcon: 'md/MdCheck',
      url: null,
    },
  },
}

export const Outlined = {
  render: (args) => <PropButtonOutlined {...args} />,
  args: {
    prop: {
      enabled: true,
      name: 'Outlined Button',
      value: 'Outlined Button',
      color: '#2e7d32',
      startIcon: 'md/MdStar',
      url: null,
    },
  },
}

export const Text = {
  render: (args) => <PropButtonText {...args} />,
  args: {
    prop: {
      enabled: true,
      name: 'Text Button',
      value: 'Text Button',
      color: '#ed6c02',
      url: null,
    },
  },
}

export const Icon = {
  render: (args) => <PropButtonIcon {...args} />,
  args: {
    prop: {
      enabled: true,
      icon: 'md/MdSettings',
      color: '#9c27b0',
      size: 32,
      url: null,
    },
  },
}
