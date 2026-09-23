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
  // No `activeColor`/`activeIcon` set, so these fall back to the
  // prop-level `activeColor`/`activeIcon` below when selected.
  opt1: {
    name: 'Apple',
    color: '#d32f2f',
    icon: 'md/MdApple',
    activeName: 'Apple (Selected)',
  },
  opt2: { name: 'Banana', color: '#fbc02d', icon: 'md/MdFavorite' },
  opt3: { name: 'Cherry', color: '#c2185b', icon: 'md/MdStar' },
  opt4: {
    name: 'Durian (Disabled)',
    color: '#9e9e9e',
    icon: 'md/MdBlock',
    enabled: false,
  },
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
      helperText: 'Pick your favorite fruit',
      activeColor: '#000000',
      activeIcon: 'md/MdCheckCircle',
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
      helperText: 'Pick as many fruits as you like',
      activeColor: '#000000',
      activeIcon: 'md/MdCheckCircle',
    },
    currentVal: ['opt1', 'opt2'],
    onChange: () => {},
  },
}

const manyMockOptions = {
  opt1: { name: 'Apple', color: '#d32f2f', icon: 'md/MdApple' },
  opt2: { name: 'Banana', color: '#fbc02d', icon: 'md/MdFavorite' },
  opt3: { name: 'Cherry', color: '#c2185b', icon: 'md/MdStar' },
  opt4: { name: 'Date', color: '#795548', icon: 'md/MdCircle' },
  opt5: { name: 'Elderberry', color: '#4a148c', icon: 'md/MdSquare' },
  opt6: { name: 'Fig', color: '#880e4f', icon: 'md/MdDiamond' },
  opt7: { name: 'Grape', color: '#6a1b9a', icon: 'md/MdHexagon' },
  opt8: { name: 'Honeydew', color: '#81c784', icon: 'md/MdBrightness1' },
}

export const ManyItems = {
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
      options: manyMockOptions,
      placeholder: 'Select multiple items',
      labelPlacement: 'end',
      numVisibleTags: 1,
      value: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'],
    },
    currentVal: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'],
    onChange: () => {},
  },
}
