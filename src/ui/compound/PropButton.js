import { Box, Button } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import { sendCommand } from '../../data/data'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '100%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropButton = ({ prop, sx = [], ...props }) => {
  const enabled = prop.enabled || false
  const dispatch = useDispatch()

  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Button
        variant="contained" // TODO: customizable
        {...{ enabled }}
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
