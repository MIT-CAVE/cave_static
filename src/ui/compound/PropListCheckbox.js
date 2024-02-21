import {
  Box,
  Checkbox,
  FormControl,
  FormGroup,
  FormControlLabel,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment } from 'react'

import { withIndex, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropListCheckbox = ({
  prop,
  currentVal,
  sx = [],
  onChange,
  ...props
}) => {
  const { enabled = false, options } = prop
  const value = R.defaultTo(prop.value, currentVal)

  const groupedByField = R.groupBy((fieldOptions) =>
    R.prop('field', fieldOptions)
  )(withIndex(options))

  const getField = ([field, fieldOptions]) => (
    <Fragment key={field}>
      <Typography my={1} fontWeight={700} color="text.secondary">
        {field}
      </Typography>
      <FormGroup>
        {R.map(
          ({ id: key, name: label }) => (
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
          ),
          fieldOptions
        )}
      </FormGroup>
    </Fragment>
  )

  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <FormControl>{R.map(getField, R.toPairs(groupedByField))}</FormControl>
    </Box>
  )
}

PropListCheckbox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropListCheckbox
