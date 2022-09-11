import { Grid } from '@mui/material'
import PropTypes from 'prop-types'

const HeaderSelectWrapper = ({ sx = [], ...props }) => (
  <Grid display="flex" item zeroMinWidth {...{ sx, ...props }} />
)
HeaderSelectWrapper.propTypes = {
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default HeaderSelectWrapper
