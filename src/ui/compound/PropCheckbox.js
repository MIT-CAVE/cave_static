import {
  Checkbox,
  Divider,
  FormGroup,
  FormControlLabel,
  Box,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { customSort, forceArray, unitStyles } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropCheckbox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const { enabled = false, options } = prop
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  const value = R.defaultTo(prop.value, currentVal)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <FormGroup>
        {R.map(({ id: key, name: label }) => (
          <FormControlLabel
            {...{ key, label }}
            disabled={!enabled}
            sx={{ pl: 1 }}
            control={
              <Checkbox
                checked={R.includes(key)(value)}
                onClick={() => {
                  if (!enabled) return
                  onChange(
                    R.ifElse(
                      R.includes(key),
                      R.without([key]),
                      R.append(key)
                    )(value)
                  )
                }}
              />
            }
          />
        ))(customSort(options))}
      </FormGroup>
      <Divider orientation="vertical" flexItem />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
    </Box>
  )
}
PropCheckbox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropCheckbox
