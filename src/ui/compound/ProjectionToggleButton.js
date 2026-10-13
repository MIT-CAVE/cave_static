import { ToggleButton } from '@mui/material'
import PropTypes from 'prop-types'
import { TbGlobe, TbGlobeOff } from 'react-icons/tb'

const styles = {
  toggleButton: {
    bgcolor: 'background.paper',
    opacity: 0.5,
    '&.Mui-selected': {
      opacity: 1,
    },
  },
}

export const ProjectionToggleButton = ({ enabled, selected, onToggle }) => (
  <ToggleButton
    disabled={!enabled}
    size="small"
    value="projection-toggle"
    selected={selected}
    title={selected ? 'Switch to flat map' : 'Switch to globe'}
    onClick={(event) => {
      event.stopPropagation()
      onToggle(!selected)
    }}
    sx={styles.toggleButton}
  >
    {selected ? <TbGlobe size={18} /> : <TbGlobeOff size={18} />}
  </ToggleButton>
)
ProjectionToggleButton.propTypes = {
  enabled: PropTypes.bool,
  selected: PropTypes.bool,
  onToggle: PropTypes.func,
}
