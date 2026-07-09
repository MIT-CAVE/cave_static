import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import PropDropdown from '../ui/compound/PropDropdown'

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
  opt1: { name: 'High Priority', color: '#d32f2f', icon: 'md/MdError' },
  opt2: { name: 'Medium Priority', color: '#ed6c02', icon: 'md/MdWarning' },
  opt3: { name: 'Low Priority', color: '#2e7d32', icon: 'md/MdInfo' },
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
    },
    currentVal: ['opt2'],
    onChange: () => {},
  },
}
