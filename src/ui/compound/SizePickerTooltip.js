import { Box, Slider, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

const SizePickerTooltip = ({ children, value, onSelect }) => {
  const [instValue, setInstValue] = useState(parseInt(value))

  return (
    <Tooltip
      enterTouchDelay={0}
      title={
        <Box sx={{ width: 250, px: 2, mx: 'auto' }}>
          <Slider
            value={instValue}
            max={75}
            onChange={(_, val) => setInstValue(val)}
            valueLabelDisplay="auto"
            onChangeCommitted={() => {
              onSelect(`${instValue}px`)
            }}
          />
        </Box>
      }
    >
      {children}
    </Tooltip>
  )
}

SizePickerTooltip.propTypes = {
  value: PropTypes.string,
  onSelect: PropTypes.func,
  children: PropTypes.node,
}

export default SizePickerTooltip
