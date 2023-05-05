import { Box, Button, Divider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../data/data'
import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropButton = ({ prop, sx = [], ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)
  const dispatch = useDispatch()

  const enabled = prop.enabled || false
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box
      sx={[getStyles(enabled), ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <Button
        variant="contained" // TODO: customizable
        enabled={enabled.toString()}
        onClick={() => {
          if (!enabled) return
          dispatch(
            sendCommand({
              command: 'mutate_session',
              data: {
                api_command: R.prop('apiCommand', prop),
                api_command_keys: R.prop('apiCommandKeys', prop),
              },
            })
          )
        }}
      >
        {prop.value || prop.name}
      </Button>
      <Divider sx={{ ml: 1 }} orientation="vertical" flexItem />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
    </Box>
  )
}
PropButton.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropButton
