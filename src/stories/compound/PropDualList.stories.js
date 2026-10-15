import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import { expect, fn, within } from 'storybook/test'

import PropDualList from '../../ui/compound/PropDualList'

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

const propDualListStories = {
  title: 'Compound/PropDualList',
  component: PropDualList,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: '700px',
  },
}

export default propDualListStories

const mockOptions = {
  opt1: { name: 'Apple', color: '#d32f2f', icon: 'md/MdApple' },
  opt2: { name: 'Banana', color: '#fbc02d', icon: 'md/MdFavorite' },
  opt3: { name: 'Cherry', color: '#c2185b', icon: 'md/MdStar' },
  opt4: { name: 'Date', color: '#795548', icon: 'md/MdCircle' },
  opt5: { name: 'Elderberry', color: '#4a148c', icon: 'md/MdSquare' },
  opt6: { name: 'Fig', color: '#880e4f', icon: 'md/MdDiamond' },
  opt7: { name: 'Grape', color: '#6a1b9a', icon: 'md/MdHexagon' },
  opt8: { name: 'Honeydew', color: '#81c784', icon: 'md/MdBrightness1' },
  opt9: { name: 'Kiwi', color: '#8bc34a', icon: 'md/MdCircle' },
  opt10: { name: 'Lemon', color: '#ffeb3b', icon: 'md/MdStar' },
  opt11: { name: 'Mango', color: '#ff9800', icon: 'md/MdFavorite' },
  opt12: { name: 'Nectarine', color: '#ff5722', icon: 'md/MdApple' },
}

// NOTE: The tooltip's label is on the span that wraps the button
const getTransferButton = (canvas, title) =>
  within(canvas.getByLabelText(title)).getByRole('button')

export const Standard = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDualList
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
      availableTitle: 'Available Fruits',
      selectedTitle: 'Selected Fruits',
      height: 260,
      helperText: 'Move fruits between the lists to build your selection',
      value: ['opt1', 'opt2', 'opt3'],
    },
    currentVal: ['opt1', 'opt2', 'opt3'],
    onChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByTitle('Add item').length).toBeGreaterThan(0)
    await expect(
      getTransferButton(canvas, 'Move all to selected')
    ).toBeEnabled()
  },
}

export const ManySelected = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDualList
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
      availableTitle: 'Available Items',
      selectedTitle: 'Selected Items',
      height: 280,
      value: ['opt1', 'opt2', 'opt4', 'opt5', 'opt7', 'opt8', 'opt10'],
    },
    currentVal: ['opt1', 'opt2', 'opt4', 'opt5', 'opt7', 'opt8', 'opt10'],
    onChange: () => {},
  },
}

export const Disabled = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDualList
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
      enabled: false,
      options: mockOptions,
      availableTitle: 'Available Items',
      selectedTitle: 'Selected Items',
      height: 240,
      value: ['opt1', 'opt2'],
    },
    currentVal: ['opt1', 'opt2'],
    onChange: () => {},
  },
}

export const ReadOnly = {
  ...Standard,
  args: {
    ...Standard.args,
    prop: { ...Standard.args.prop, readOnly: true },
    onChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByTitle(/^(Add|Remove) item$/)).toHaveLength(0)
    for (const name of [
      'Move all to selected',
      'Move checked to selected',
      'Move checked to available',
      'Remove all selected',
    ]) {
      await expect(getTransferButton(canvas, name)).toBeDisabled()
    }
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}
