/** @jsxImportSource @emotion/react */
import { Box, Radio } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const verifySelectorValue = (val) => {
  return R.is(Array, val) ? val : false
}

const PropRadio = ({ prop, currentVal, sx = [], onChange, ...props }) => (
  <Box sx={[{ pl: 1 }, ...forceArray(sx)]} {...props}>
    <div css={{ fontSize: '25px' }}>{R.prop('label', prop)}</div>
    {R.values(
      R.mapObjIndexed((value, key, object) => {
        return (
          <div
            key={key}
            css={{ opacity: R.propOr(false, 'enabled', prop) ? '' : 0.7 }}
          >
            {R.prop('name', value)}
            <Radio
              key={key}
              value={R.prop('name', value)}
              name={R.prop('name', value)}
              checked={R.prop('value', value)}
              onChange={() => {
                if (R.propOr(false, 'enabled', prop))
                  onChange(
                    R.update(
                      key,
                      R.assoc('value', true, value)
                    )(R.map(R.assoc('value', false), object))
                  )
              }}
            />
          </div>
        )
      })(verifySelectorValue(currentVal) || R.prop('value', prop))
    )}
  </Box>
)
PropRadio.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.bool,
    })
  ),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropRadio
