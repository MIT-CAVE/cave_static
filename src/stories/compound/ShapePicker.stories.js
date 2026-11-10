import { configureStore } from '@reduxjs/toolkit'
import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { expect, userEvent, within } from 'storybook/test'

import ShapePicker, { EnhancedListbox } from '../../ui/compound/ShapePicker'

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

const shapePickerStories = {
  title: 'Compound/ShapePicker',
  component: ShapePicker,
  decorators: [reduxDecorator],
}

export default shapePickerStories

const sampleOptions = [
  'md/MdWarehouse',
  'md/MdLocalShipping',
  'md/MdStorefront',
  'fa/FaAnchor',
  'fa/FaPlane',
]

export const Default = {
  render: function Render(args) {
    const [val, setVal] = useState(args.value)
    return (
      <ShapePicker
        {...args}
        value={val}
        onChange={(event, newVal) => {
          args.onChange?.(event, newVal)
          setVal(newVal)
        }}
      />
    )
  },
  args: {
    label: 'Search available icons',
    value: 'md/MdWarehouse',
    options: sampleOptions,
    ListboxComponent: EnhancedListbox,
    getIcon: (opt) => opt,
    getLabel: (opt) => opt?.split('/')[1] ?? opt,
    onChange: () => {},
  },
}

export const Interactive = {
  render: function Render() {
    const [val, setVal] = useState('md/MdWarehouse')
    return (
      <div style={{ width: 320, padding: 16 }}>
        <div data-testid="selected-value">{val}</div>
        <ShapePicker
          label="Search available icons"
          value={val}
          options={sampleOptions}
          ListboxComponent={EnhancedListbox}
          getIcon={(opt) => opt}
          getLabel={(opt) => opt?.split('/')[1] ?? opt}
          onChange={(event, newVal) => setVal(newVal)}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('combobox')
    expect(input).toBeDefined()
    expect(canvas.getByTestId('selected-value').textContent).toBe(
      'md/MdWarehouse'
    )

    // Clear input then type 'Plane' to filter options
    await userEvent.clear(input)
    await userEvent.type(input, 'Plane')

    // Find and click the filtered option
    const option = await within(document.body).findByRole('option', {
      name: /FaPlane/i,
    })
    expect(option).toBeDefined()
    await userEvent.click(option)

    // Check that value is updated
    expect(canvas.getByTestId('selected-value').textContent).toBe('fa/FaPlane')
  },
}
