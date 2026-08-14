import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import PropComboBox from '../../ui/compound/PropComboBox'
import PropComboBoxMulti from '../../ui/compound/PropComboBoxMulti'

const mockStore = configureStore({
  reducer: {
    data: (
      state = {
        settings: {
          iconUrl: undefined,
        },
      }
    ) => state,
    utilities: (
      state = {
        virtualKeyboard: {
          isOpen: false,
          layout: 'default',
          caretPosition: [0, 0],
          enter: false,
          lastKeyPress: null,
          inputValue: '',
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

const propComboBoxStories = {
  title: 'Compound/PropComboBox',
  component: PropComboBox,
  decorators: [reduxDecorator],
}

export default propComboBoxStories

const mockOptions = {
  opt1: { name: 'Apple', color: '#d32f2f', icon: 'md/MdApple' },
  opt2: { name: 'Banana', color: '#fbc02d', icon: 'md/MdFavorite' },
  opt3: { name: 'Cherry', color: '#c2185b', icon: 'md/MdStar' },
}

export const Single = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropComboBox
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
      placeholder: 'Select a fruit',
      labelPlacement: 'end',
      value: ['opt1'],
    },
    currentVal: ['opt1'],
    onChange: () => {},
  },
}

export const Multi = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropComboBoxMulti
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
      placeholder: 'Select multiple fruits',
      labelPlacement: 'end',
      numVisibleTags: 2,
      value: ['opt1', 'opt2'],
    },
    currentVal: ['opt1', 'opt2'],
    onChange: () => {},
  },
}
