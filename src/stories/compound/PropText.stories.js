import React from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import { PropText, PropTextArea } from '../../ui/compound/PropText'

const propTextStories = {
  title: 'Compound/PropText',
  component: PropText,
}

export default propTextStories

export const SingleLine = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropText
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
      label: 'Username',
      value: 'JohnDoe',
      placeholder: 'Enter username...',
      fullWidth: true,
    },
    currentVal: 'JohnDoe',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox')
    await userEvent.clear(input)
    // Enter should commit and release focus (like the virtual keyboard's submit)
    await userEvent.type(input, 'Jane{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('Jane')
    await expect(input).not.toHaveFocus()
  },
}

export const MultiLine = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropTextArea
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
      label: 'Comments / Notes',
      value: 'Initial comment text...',
      rows: 4,
      placeholder: 'Type notes here...',
      fullWidth: true,
    },
    currentVal: 'Initial comment text...',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getAllByRole('textbox')[0]
    await userEvent.clear(input)
    // Multiline: Enter inserts a newline and keeps focus
    await userEvent.type(input, 'a{Enter}b')
    await userEvent.click(document.body)
    await expect(args.onChange).toHaveBeenLastCalledWith('a\nb')
  },
}
