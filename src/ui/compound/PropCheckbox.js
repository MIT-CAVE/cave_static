/** @jsxImportSource @emotion/react */
import { Box, Checkbox } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

const verifySelectorValue = (val) => {
  return R.is(Array, val) ? val : false
}

const PropCheckbox = ({ prop, currentVal, onChange, ...props }) => (
  <Box {...props}>
    <div css={{ fontSize: '25px' }}>{R.prop('label', prop)}</div>
    <div css={{ opacity: R.propOr(false, 'enabled', prop) ? '' : 0.7 }}>
      {R.values(
        R.mapObjIndexed((value, key, object) => {
          return (
            <div css={{ cursor: 'pointer', fontSize: '25px' }} key={key}>
              <Checkbox
                checked={R.prop('value', value)}
                onClick={() => {
                  if (R.propOr(false, 'enabled', prop))
                    onChange(
                      R.update(
                        key,
                        R.assoc('value', !R.prop('value', value), value),
                        object
                      )
                    )
                }}
              />
              <span css={{ fontSize: '1rem' }}>{R.prop('name', value)}</span>
            </div>
          )
        })(verifySelectorValue(currentVal) || R.prop('value', prop))
      )}
    </div>
  </Box>
)
PropCheckbox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.bool,
    })
  ),
  onChange: PropTypes.func,
}

export default PropCheckbox
