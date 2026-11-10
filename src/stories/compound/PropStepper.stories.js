import React from 'react'

import PropHStepper from '../../ui/compound/PropHStepper'
import PropVStepper from '../../ui/compound/PropVStepper'

const propStepperStories = {
  title: 'Compound/PropStepper',
  component: PropHStepper,
}

export default propStepperStories

export const Horizontal = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropHStepper
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
      value: ['step2'],
      helperText: 'Choose the current stage',
      options: {
        step1: { name: 'Step A', help: 'Intro' },
        step2: {
          name: 'Step B',
          help: 'Processing',
          activeName: 'Step B (Current)',
        },
        step3: { name: 'Step C (Disabled)', help: 'Review', enabled: false },
        step4: { name: 'Step D', help: 'Done' },
      },
    },
    currentVal: ['step2'],
    onChange: () => {},
  },
}

export const Vertical = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropVStepper
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
      value: ['step1'],
      helperText: 'Choose the current stage',
      options: {
        step1: {
          name: 'Step A',
          help: 'Intro',
          activeName: 'Step A (Current)',
        },
        step2: {
          name: 'Step B (Disabled)',
          help: 'Processing',
          enabled: false,
        },
        step3: { name: 'Step C', help: 'Review' },
        step4: { name: 'Step D', help: 'Done' },
      },
    },
    currentVal: ['step1'],
    onChange: () => {},
  },
}
