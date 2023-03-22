import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'

const PropDateBase = ({ component, prop, currentVal, onChange }) => {
  const value = currentVal || prop.value
  const { enabled = false, readOnly, views } = prop
  const Component = component
  return (
    <Component
      {...{ readOnly, views }}
      value={dayjs(value)}
      sx={{ p: 1.5, pl: 1 }}
      disabled={!enabled}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
      onChange={(newValue) => {
        onChange(newValue)
      }}
      onAccept={(newValue) => {
        onChange(newValue)
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
