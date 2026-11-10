import { Box, ToggleButton } from '@mui/material'
import PropTypes from 'prop-types'
import { TbCrosshair, TbLocation, TbLocationOff } from 'react-icons/tb'

import { NumberFormat } from '../../utils'

const styles = {
  toggleButton: {
    bgcolor: 'background.paper',
    opacity: 0.5,
    '&.Mui-selected': {
      opacity: 1,
    },
  },
  readout: {
    position: 'absolute',
    // Mapbox's own attribution control runs along the bottom edge (not just
    // one corner - it can span wide), so this sits well above it rather
    // than trying to dodge it horizontally.
    bottom: 32,
    left: 8,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.5,
    borderRadius: 1,
    bgcolor: 'background.paper',
    color: 'text.secondary',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    // Purely informational - never steal hover/drag from the map
    // underneath it, and fade rather than pop in/out as the cursor
    // crosses the map's edge.
    pointerEvents: 'none',
    transition: 'opacity 150ms ease',
  },
}

export const CoordinateToggleButton = ({ enabled, selected, onToggle }) => (
  <ToggleButton
    disabled={!enabled}
    size="small"
    value="coordinate-readout-toggle"
    selected={selected}
    title="Show cursor coordinates"
    onClick={(event) => {
      event.stopPropagation()
      onToggle(!selected)
    }}
    sx={styles.toggleButton}
  >
    {selected ? <TbLocation size={18} /> : <TbLocationOff size={18} />}
  </ToggleButton>
)
CoordinateToggleButton.propTypes = {
  enabled: PropTypes.bool,
  selected: PropTypes.bool,
  onToggle: PropTypes.func,
}

export const CoordinateReadout = ({ active, position, numberFormatProps }) => (
  <Box sx={[styles.readout, { opacity: active ? 1 : 0 }]}>
    <TbCrosshair size={13} />
    {position && (
      <span>
        {NumberFormat.format(position[1], numberFormatProps)}
        {', '}
        {NumberFormat.format(position[0], numberFormatProps)}
      </span>
    )}
  </Box>
)
CoordinateReadout.propTypes = {
  active: PropTypes.bool,
  position: PropTypes.arrayOf(PropTypes.number),
  numberFormatProps: PropTypes.object,
}
