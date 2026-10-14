import { Box, FormHelperText } from '@mui/material'
import PropTypes from 'prop-types'

import { getScaleModeStyle } from '../../utils/mediaScaleMode'

import { forceArray } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    maxWidth: '100%',
  },
  audio: {
    width: '100%',
    // Native controls follow `color-scheme`, so they match the theme's mode
    colorScheme: (theme) => theme.palette.mode,
  },
}

const defaultWidth = { width: '300px' }

// Audio height is fixed by the native controls, so only the width is flexible
const PropAudio = ({
  prop: { value: url, scaleMode, fullWidth, helperText, propStyle = [] },
  sx = [],
}) => (
  <Box
    sx={[
      styles.root,
      getScaleModeStyle({ scaleMode, fullWidth }) != null
        ? { width: '100%' }
        : defaultWidth,
      ...forceArray(sx),
      ...forceArray(propStyle),
    ]}
  >
    <Box
      component="audio"
      controls
      src={url}
      aria-label={helperText}
      sx={styles.audio}
    />
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </Box>
)
PropAudio.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropAudio
