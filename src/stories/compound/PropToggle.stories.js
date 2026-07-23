import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import {
  PropToggleCheckbox,
  PropToggleSwitch,
  PropToggleButton,
} from '../../ui/compound/PropToggle'

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

const propToggleStories = {
  title: 'Compound/PropToggle',
  component: PropToggleCheckbox,
  decorators: [reduxDecorator],
}

export default propToggleStories

const withState = (Component) =>
  function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <Component
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  }

export const Checkbox = {
  render: withState(PropToggleCheckbox),
  args: {
    prop: {
      enabled: true,
      label: 'Checkbox Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const Switch = {
  render: withState(PropToggleSwitch),
  args: {
    prop: {
      enabled: true,
      label: 'Switch Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const Button = {
  render: withState(PropToggleButton),
  args: {
    prop: {
      enabled: true,
      label: 'Toggle Button Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const IconStates = {
  render: function Render() {
    const [currentVal, setCurrentVal] = React.useState(false)
    const onChange = (val) => setCurrentVal(val)
    const prop = {
      enabled: true,
      icon: 'md/MdVisibilityOff',
      activeIcon: 'md/MdVisibility',
      label: 'Hidden',
      activeLabel: 'Visible',
      color: '#9e9e9e',
      activeColor: '#1976d2',
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <PropToggleButton
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
        <PropToggleCheckbox
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
        <PropToggleSwitch
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
      </div>
    )
  },
  args: {},
}

export const Sizing = {
  render: function Render() {
    const [currentVal, setCurrentVal] = React.useState(false)
    const onChange = (val) => setCurrentVal(val)
    const prop = {
      enabled: true,
      icon: 'md/MdStar',
      label: 'Small → Large',
      size: 16,
      activeSize: 32,
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <PropToggleButton
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
        <PropToggleCheckbox
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
        <PropToggleSwitch
          prop={prop}
          currentVal={currentVal}
          {...{ onChange }}
        />
      </div>
    )
  },
  args: {},
}

export const LabelPlacements = {
  render: function Render() {
    const placements = ['end', 'start', 'top', 'bottom']
    const [values, setValues] = React.useState(
      Object.fromEntries(placements.map((p) => [p, false]))
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[PropToggleButton, PropToggleCheckbox, PropToggleSwitch].map(
          (Component) => (
            <div
              key={Component.name}
              style={{ display: 'flex', gap: 32, alignItems: 'center' }}
            >
              {placements.map((labelPlacement) => (
                <Component
                  key={labelPlacement}
                  prop={{
                    enabled: true,
                    label: labelPlacement,
                    labelPlacement,
                  }}
                  currentVal={values[labelPlacement]}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [labelPlacement]: val }))
                  }
                />
              ))}
            </div>
          )
        )}
      </div>
    )
  },
  args: {},
}

export const CustomPropStyle = {
  render: withState(PropToggleCheckbox),
  args: {
    prop: {
      enabled: true,
      label: 'Custom Styled',
      value: true,
      propStyle: {
        bgcolor: 'rgb(25 118 210 / .08)',
        border: '1px solid #1976d2',
        borderRadius: 1,
      },
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const Disabled = {
  render: function Render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <PropToggleButton
          prop={{ enabled: false, label: 'Disabled Button', value: false }}
          currentVal={false}
          onChange={() => {}}
        />
        <PropToggleCheckbox
          prop={{ enabled: false, label: 'Disabled Checkbox', value: true }}
          currentVal={true}
          onChange={() => {}}
        />
        <PropToggleSwitch
          prop={{ enabled: false, label: 'Disabled Switch', value: true }}
          currentVal={true}
          onChange={() => {}}
        />
      </div>
    )
  },
  args: {},
}
