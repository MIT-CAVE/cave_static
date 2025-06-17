import { Box } from '@mui/material'
import PropTypes from 'prop-types'

import { forceArray } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    position: 'relative',
  },
  iframe: {
    height: '100%',
    width: '100%',
    border: '1px solid rgb(128 128 128)',
    boxSizing: 'border-box',
  },
}

const scaleModeStyles = {
  fitWidth: { maxWidth: '100%', width: '100%' },
  fitHeight: { maxHeight: '100%', height: '100%' },
  fitContainer: { height: '100%', width: '100%' },
}

const PropVideo = ({
  prop: { value: url, scaleMode, propStyle = [] },
  sx = [],
}) => (
  <Box
    sx={[
      styles.root,
      scaleModeStyles[scaleMode],
      ...forceArray(sx),
      ...forceArray(propStyle),
    ]}
  >
    <iframe
      credentialless="true"
      title="Embedded Video"
      src={url}
      style={styles.iframe}
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; cross-origin-isolated"
    />
  </Box>
)
PropVideo.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropVideo
