import React from 'react'

import PropNumberField from '../ui/compound/PropNumberField'
import PropNumberIcon from '../ui/compound/PropNumberIcon'
import PropNumberIconCompact from '../ui/compound/PropNumberIconCompact'
import PropNumberSlider from '../ui/compound/PropNumberSlider'

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
    onChange: () => {},
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
    onChange: () => {},
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
