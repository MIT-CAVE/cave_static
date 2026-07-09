import React from 'react'

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
    onChange: () => {},
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
    onChange: () => {},
  },
}
