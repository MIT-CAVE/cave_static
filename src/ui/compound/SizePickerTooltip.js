import { Box, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

import StableTooltip from './StableTooltip'

const SizePickerTooltip = ({ children, value, onSelect }) => {
  const [instValue, setInstValue] = useState(parseInt(value))

  return (
    <StableTooltip
      title={
        <Box sx={{ width: 250, px: 2, mx: 'auto' }}>
          <Slider
            value={instValue}
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
    </StableTooltip>
  )
}

SizePickerTooltip.propTypes = {
  value: PropTypes.string,
  onSelect: PropTypes.func,
  children: PropTypes.node,
}

export default SizePickerTooltip
