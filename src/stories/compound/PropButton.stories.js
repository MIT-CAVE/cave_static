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

export const WithUrl = {
  render: (args) => <PropButtonFilled {...args} />,
  args: {
    prop: {
      enabled: true,
      name: 'Open Docs',
      value: 'Open Docs',
      color: '#1976d2',
      url: 'https://github.com/MIT-CAVE',
    },
  },
}

export const UrlWithCommand = {
  render: function Render() {
    const commandProps = {
      apiCommand: 'log_click',
      apiCommandKeys: ['demo'],
      dataName: 'demo',
      dataPath: [],
      dataValue: true,
      url: 'https://github.com/MIT-CAVE',
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <PropButtonFilled
          prop={{
            enabled: true,
            name: 'Both fire (default)',
            value: 'Both fire (default)',
            color: '#1976d2',
            ...commandProps,
          }}
        />
        <PropButtonFilled
          prop={{
            enabled: true,
            name: 'URL only (suppressCommand)',
            value: 'URL only (suppressCommand)',
            color: '#2e7d32',
            suppressCommand: true,
            ...commandProps,
          }}
        />
      </div>
    )
  },
  args: {},
}

export const FullWidth = {
  render: (args) => (
    <div style={{ width: 300, border: '1px dashed #999', padding: 8 }}>
      <PropButtonFilled {...args} />
    </div>
  ),
  args: {
    prop: {
      enabled: true,
      name: 'Full Width Button',
      value: 'Full Width Button',
      color: '#1976d2',
      fullWidth: true,
    },
  },
}

export const Disabled = {
  render: function Render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <PropButtonFilled
          prop={{ enabled: false, name: 'Disabled Filled', color: '#1976d2' }}
        />
        <PropButtonOutlined
          prop={{
            enabled: false,
            name: 'Disabled Outlined',
            color: '#2e7d32',
          }}
        />
        <PropButtonText
          prop={{ enabled: false, name: 'Disabled Text', color: '#ed6c02' }}
        />
        <PropButtonIcon
          prop={{ enabled: false, icon: 'md/MdSettings', color: '#9c27b0' }}
        />
      </div>
    )
  },
  args: {},
}
