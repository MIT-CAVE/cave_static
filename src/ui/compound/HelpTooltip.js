import { IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { MdHelpOutline } from 'react-icons/md'

import RichTooltip from './RichTooltip'

import { forceArray } from '../../utils'

const styles = {
  button: {
    opacity: 0.7,
    '&:hover': {
      opacity: 0.9,
      backgroundColor: 'transparent',
    },
  },
}

const HelpTooltip = ({ title, content, size = 22, sx = [], ...props }) => (
  <RichTooltip {...{ title, content, ...props }}>
    <IconButton
      aria-label="info"
      size="small"
      sx={[styles.button, ...forceArray(sx)]}
      {...props}
    >
      <MdHelpOutline {...{ size }} />
    </IconButton>
  </RichTooltip>
)
HelpTooltip.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default HelpTooltip
