import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'
import { useState } from 'react'

const PropDateBase = ({ component, prop, currentVal, onChange }) => {
  const defaultValue = currentVal || prop.value
  const [value, setValue] = useState(dayjs(defaultValue))

  const { enabled = false, readOnly, views } = prop
  const Component = component
  return (
    <Component
      sx={{ p: 1.5, pl: 1 }}
      {...{ readOnly, value, views }}
      disabled={!enabled}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
      onChange={(newValue) => setValue(newValue)}
      onClose={() => {
        if (enabled) onChange(value)
      }}
    />
  )
}
PropDateBase.propTypes = {
  component: PropTypes.object,
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  onChange: PropTypes.func,
}

const PropDate = ({ ...props }) => (
  <PropDateBase component={DatePicker} {...props} />
)

const PropDateTime = ({ ...props }) => (
  <PropDateBase component={DateTimePicker} {...props} />
)

const PropTime = ({ ...props }) => (
  <PropDateBase component={TimePicker} {...props} />
)

export { PropDate, PropDateTime, PropTime }
