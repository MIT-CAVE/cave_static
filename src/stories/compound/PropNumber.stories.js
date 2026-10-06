import React from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import PropNumberField from '../../ui/compound/PropNumberField'
import PropNumberIcon from '../../ui/compound/PropNumberIcon'
import PropNumberIconCompact from '../../ui/compound/PropNumberIconCompact'
import PropNumberIconCompactAlt from '../../ui/compound/PropNumberIconCompactAlt'
import PropNumberSlider from '../../ui/compound/PropNumberSlider'

const propNumberStories = {
  title: 'Compound/PropNumber',
  component: PropNumberField,
}

export default propNumberStories

export const NumberField = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropNumberField
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
      label: 'Volume',
      value: 125,
      minValue: 0,
      maxValue: 1000,
      placeholder: 'Enter volume...',
      spinner: 'leftAndRight',
      step: 10,
    },
    currentVal: 125,
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')
    // Click into the input box
    await userEvent.click(input)
    // Select all and type 1500 (over max 1000)
    await userEvent.clear(input)
    await userEvent.type(input, '1500')
    // Now backspace to 150 (within range)
    await userEvent.keyboard('{Backspace}')
    // Click away (blur)
    await userEvent.click(document.body)
    await expect(args.onChange).toHaveBeenLastCalledWith(150)
    await expect(input.value).toBe('150.00')
  },
}

export const NumberSlider = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropNumberSlider
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
      label: 'Intensity',
      value: 75,
      minValue: 0,
      maxValue: 100,
      color: '#42a5f5',
    },
    currentVal: 75,
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')
    // Click into the input box
    await userEvent.click(input)
    // Select all and type 150 (over max 100)
    await userEvent.clear(input)
    await userEvent.type(input, '150')
    // Now backspace to 15 (within range [0, 100])
    await userEvent.keyboard('{Backspace}')
    // Click away (blur)
    await userEvent.click(document.body)
    await expect(args.onChange).toHaveBeenLastCalledWith(15)
    await expect(input.value).toBe('15.00')
  },
}

export const NumberIcon = {
  render: (args) => <PropNumberIcon {...args} />,
  args: {
    prop: {
      name: 'Global Output KPI',
      value: 94827.42,
      icon: 'md/MdTrendingUp',
      precision: 2,
      unit: '$',
      unitPlacement: 'after',
    },
  },
}

export const NumberIconCompact = {
  render: (args) => <PropNumberIconCompact {...args} />,
  args: {
    prop: {
      name: 'Temp',
      value: 23.5,
      icon: 'md/MdDeviceThermostat',
      precision: 1,
      unit: '°C',
    },
  },
}

export const NumberIconCompactAlt = {
  render: (args) => <PropNumberIconCompactAlt {...args} />,
  args: {
    prop: {
      name: 'Total Revenue',
      value: 1250000,
      icon: 'md/MdTrendingUp',
      precision: 2,
      unit: '$',
      color: '#2e7d32',
    },
  },
}

export const NumberIconCompactAltNeutral = {
  render: (args) => <PropNumberIconCompactAlt {...args} />,
  args: {
    prop: {
      name: 'Units Shipped',
      value: 18400,
      icon: 'md/MdLocalShipping',
      precision: 0,
    },
  },
}
