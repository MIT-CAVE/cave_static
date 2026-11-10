import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import PropDropdown from '../../ui/compound/PropDropdown'

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

const propDropdownStories = {
  title: 'Compound/PropDropdown',
  component: PropDropdown,
  decorators: [reduxDecorator],
}

export default propDropdownStories

const mockOptions = {
  // No `activeColor`/`activeIcon` set, so these fall back to the
  // prop-level `activeColor`/`activeIcon` below when selected.
  opt1: { name: 'High Priority', color: '#d32f2f', icon: 'md/MdError' },
  opt2: {
    name: 'Medium Priority',
    color: '#ed6c02',
    icon: 'md/MdWarning',
    activeName: 'Medium Priority (Selected)',
  },
  opt3: { name: 'Low Priority', color: '#2e7d32', icon: 'md/MdInfo' },
  opt4: {
    name: 'Archived (Disabled)',
    color: '#9e9e9e',
    icon: 'md/MdArchive',
    enabled: false,
  },
}

export const Standard = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDropdown
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  args: {
    prop: {
      enabled: true,
      options: mockOptions,
      labelPlacement: 'end',
      value: ['opt2'],
      helperText: 'Choose a priority level',
      activeColor: '#000000',
      activeIcon: 'md/MdCheckCircle',
    },
    currentVal: ['opt2'],
    onChange: () => {},
  },
}

export const Empty = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDropdown
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  args: {
    prop: {
      enabled: true,
      options: mockOptions,
      labelPlacement: 'end',
      value: [],
      placeholder: 'Select a priority level',
      helperText: 'The placeholder is shown until an option is selected',
    },
    currentVal: [],
    onChange: () => {},
  },
}
