import React from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import PropComboBox from '../../../ui/compound/PropComboBox'
import { PropTextArea } from '../../../ui/compound/PropText'

// Uses the real store and the global virtual keyboard (not hidden) to verify
// how a physical Enter behaves while the virtual keyboard is open.
const virtualKeyboardEnterStories = {
  title: 'Views/Common/VirtualKeyboard/Physical Enter',
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '600px',
    preloadedState: {
      utilities: { virtualKeyboard: { isOpen: true } },
    },
  },
}

export default virtualKeyboardEnterStories

// Wait for the (delayed) keyboard open after focus
const waitForKeyboard = () =>
  waitFor(() =>
    expect(document.querySelector('.hg-theme-default')).toBeTruthy()
  )

export const TextAreaEnterInsertsNewline = {
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
      label: 'Notes',
      value: '',
      rows: 4,
      fullWidth: true,
    },
    currentVal: '',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getAllByRole('textbox')[0]
    await userEvent.click(input)
    await waitForKeyboard()
    // With the keyboard open, a physical Enter in a textarea must insert a
    // newline (like the on-screen `{enter}`), not submit and blur.
    await userEvent.keyboard('a{Enter}b')
    await waitFor(() => expect(input.value).toBe('a\nb'))
    await expect(input).toHaveFocus()
  },
}

export const ComboBoxEnterSelectsHighlighted = {
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
      label: 'Fruit',
      options: {
        opt1: { name: 'Apple' },
        opt2: { name: 'Banana' },
        opt3: { name: 'Cherry' },
      },
      value: [],
      fullWidth: true,
    },
    currentVal: [],
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    await waitForKeyboard()
    // Highlight the first option, then Enter selects it. It must not also
    // trigger the virtual keyboard's submit (which would blur the field).
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(args.onChange).toHaveBeenCalledWith(['opt1']))
    await expect(input).toHaveFocus()
  },
}
