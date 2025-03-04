import { Box, Button } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import { sendCommand } from '../../data/data'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropButton = ({ prop, sx = [], ...props }) => {
  const dispatch = useDispatch()
  const enabled = prop.enabled
  return (
    <Box
      sx={[getStyles(enabled), ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <Button
        variant="contained" // TODO: customizable
        disabled={!enabled}
        onClick={() => {
          if (!enabled) return
          dispatch(
            sendCommand({
              command: 'mutate_session',
              data: {
                api_command: R.prop('apiCommand')(prop),
                api_command_keys: R.prop('apiCommandKeys')(prop),
                data_name: R.prop('dataName')(prop),
                data_path: R.prop('dataPath')(prop),
                data_value: R.prop('dataValue')(prop),
              },
            })
          )
        }}
      >
        {prop.value || prop.name}
      </Button>
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
