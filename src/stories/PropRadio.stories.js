import React from 'react'

import PropHRadio from '../ui/compound/PropHRadio'
import PropRadio from '../ui/compound/PropRadio'

const propRadioStories = {
  title: 'Compound/PropRadio',
  component: PropRadio,
}

export default propRadioStories

export const Vertical = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropRadio
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
      value: ['opt2'],
      options: {
        opt1: { name: 'Option A', help: 'Tooltip for A' },
        opt2: { name: 'Option B', help: 'Tooltip for B' },
        opt3: { name: 'Option C', help: 'Tooltip for C' },
      },
      labelPlacement: 'end',
      helperText: 'Select one choice from above',
    },
    currentVal: ['opt2'],
    onChange: () => {},
  },
}

export const Horizontal = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropHRadio
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
      value: ['opt1'],
      options: {
        opt1: { name: 'Option A', help: 'Tooltip for A' },
        opt2: { name: 'Option B', help: 'Tooltip for B' },
        opt3: { name: 'Option C', help: 'Tooltip for C' },
      },
      labelPlacement: 'bottom',
      helperText: 'Select choice horizontally',
    },
    currentVal: ['opt1'],
    onChange: () => {},
  },
}
