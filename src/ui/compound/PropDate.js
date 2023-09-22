import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const PropDateBase = ({ component, prop, currentVal, sx = [], onChange }) => {
  const value = R.defaultTo(prop.value, currentVal)
  const { enabled = false, readOnly, views } = prop
  const Component = component
  return (
    <Component
      {...{ readOnly, views }}
      value={dayjs(value)}
      sx={[{ p: 1 }, ...forceArray(sx)]}
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
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

const PropDate = (props) => <PropDateBase component={DatePicker} {...props} />

const PropTime = (props) => <PropDateBase component={TimePicker} {...props} />

const PropDateTime = (props) => (
  <PropDateBase component={DateTimePicker} {...props} />
)

export { PropDate, PropDateTime, PropTime }
