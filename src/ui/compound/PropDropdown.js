/** @jsxImportSource @emotion/react */
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { SimpleDropdown } from './SimpleDropdown'

const verifySelectorValue = (val) => {
  return R.is(Array, val) ? val : false
}

const PropDropdown = ({ prop, currentVal, onChange, ...props }) => {
  return (
    <Box {...props}>
      <div css={{ fontSize: '25px' }}>{R.prop('label', prop)}</div>
      <div
        css={{
          alignSelf: 'center',
          opacity: R.propOr(false, 'enabled', prop) ? '' : 0.7,
        }}
      >
        <SimpleDropdown
          value={R.findIndex(R.prop('value'))(
            verifySelectorValue(currentVal) || R.prop('value', prop)
          )}
          onSelect={(idx) => {
            const object =
              verifySelectorValue(currentVal) || R.prop('value', prop)
            if (R.propOr(false, 'enabled', prop))
              onChange(
                R.update(
                  idx,
                  R.assoc('value', true, R.nth(idx, object))
                )(R.map(R.assoc('value', false), object))
              )
          }}
          optionsList={R.range(
            0,
            R.length(verifySelectorValue(currentVal) || R.prop('value', prop))
          )}
          getLabel={R.pipe(
            R.nth(
              R.__,
              verifySelectorValue(currentVal) || R.prop('value', prop)
            ),
            R.prop('name')
          )}
          enabled={R.propOr(false, 'enabled', prop)}
        />
      </div>
    </Box>
  )
}
PropDropdown.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.bool,
    })
  ),
  onChange: PropTypes.func,
}

export default PropDropdown
