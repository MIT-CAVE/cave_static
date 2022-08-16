/** @jsxImportSource @emotion/react */
import { Box, Switch } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

const PropToggle = ({ prop, currentVal, onChange, ...props }) => {
  const opacityCss = { opacity: R.propOr(false, 'enabled', prop) ? '' : 0.7 }
  return (
    <Box {...props}>
      <div
        css={{
          display: 'inline-block',
          margin: R.prop('label', prop) ? '25px' : '5px',
          fontSize: '15px',
          fontWeight: 600,
        }}
      >
        {R.prop('label', prop)}
      </div>
      <Switch
        css={opacityCss}
        checked={R.defaultTo(R.prop('value', prop), currentVal)}
        onChange={
          R.propOr(false, 'enabled', prop)
            ? (event) => onChange(event.target.checked)
            : () => {}
        }
      />
    </Box>
  )
}
PropToggle.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.bool,
  onChange: PropTypes.func,
}

export default PropToggle
