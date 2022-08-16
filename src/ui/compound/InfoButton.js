import { IconButton, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import { MdInfoOutline } from 'react-icons/md'

const InfoButton = ({ text, ...props }) => (
  <Tooltip title={text} enterDelay={300} leaveDelay={300} {...props}>
    <IconButton size="small" aria-label="info">
      <MdInfoOutline />
    </IconButton>
  </Tooltip>
)
InfoButton.propTypes = { text: PropTypes.string }

export default InfoButton
