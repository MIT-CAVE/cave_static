import { Box, Button, Dialog } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropPicture = ({ prop, sx = [], ...props }) => {
  const [expanded, setExpanded] = React.useState(false)
  const numberFormatDefault = useSelector(selectNumberFormat)

  const enabled = true //prop.enabled || false
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box
      sx={[getStyles(enabled), ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <img src={prop.value} alt="" />
      <Button
        variant="contained"
        enabled={enabled.toString()}
        onClick={() => {
          setExpanded(true)
        }}
      >
        EXPAND
      </Button>
      <Dialog
        open={expanded}
        onClose={() => {
          setExpanded(false)
        }}
        maxWidth="md"
        fullWidth="true"
      >
        <img src={prop.value} alt="" width="auto" height="auto" />
      </Dialog>
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
    </Box>
  )
}
PropPicture.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropPicture
