import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import PropCheckbox from '../ui/compound/PropCheckbox'
import PropHCheckbox from '../ui/compound/PropHCheckbox'

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

const propCheckboxStories = {
  title: 'Compound/PropCheckbox',
  component: PropCheckbox,
  decorators: [reduxDecorator],
}

export default propCheckboxStories

const mockOptions = {
  opt1: { name: 'Option 1', color: '#1976d2' },
  opt2: { name: 'Option 2', color: '#388e3c' },
  opt3: { name: 'Option 3 (Disabled)', color: '#d32f2f', enabled: false },
}

export const Standard = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropCheckbox
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
      value: ['opt1'],
      labelPlacement: 'end',
      helperText: 'Choose one or more options',
    },
    currentVal: ['opt1'],
    onChange: () => {},
  },
}

export const Horizontal = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropHCheckbox
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
      value: ['opt1', 'opt2'],
      labelPlacement: 'bottom',
      helperText: 'Horizontal checkbox layout',
    },
    currentVal: ['opt1', 'opt2'],
    onChange: () => {},
  },
}
