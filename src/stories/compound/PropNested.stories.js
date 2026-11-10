import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import PropNested from '../../ui/compound/PropNested'

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

const propNestedStories = {
  title: 'Compound/PropNested',
  component: PropNested,
  decorators: [reduxDecorator],
}

export default propNestedStories

const mockOptions = {
  // No `activeColor`/`activeIcon` set, so these fall back to the
  // prop-level `activeColor`/`activeIcon` below when checked.
  apple: {
    name: 'Apple',
    path: ['Produce', 'Fruits'],
    color: '#d32f2f',
    icon: 'md/MdApple',
    activeName: 'Apple (Selected)',
  },
  banana: {
    name: 'Banana',
    path: ['Produce', 'Fruits'],
    color: '#fbc02d',
    icon: 'md/MdFavorite',
  },
  carrot: {
    name: 'Carrot',
    path: ['Produce', 'Vegetables'],
    color: '#ff9800',
    icon: 'md/MdEco',
  },
  kale: {
    name: 'Kale (Disabled)',
    path: ['Produce', 'Vegetables'],
    color: '#388e3c',
    icon: 'md/MdEco',
    enabled: false,
  },
}

export const Standard = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropNested
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
      value: ['apple'],
      helperText: 'Choose one or more produce items',
      activeColor: '#000000',
      activeIcon: 'md/MdCheckCircle',
    },
    currentVal: ['apple'],
    onChange: () => {},
  },
}
