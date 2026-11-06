import { Box, FormHelperText } from '@mui/material'
import PropTypes from 'prop-types'

import RichLabel from './RichLabel'

import { labelText } from '../../utils/richText'

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

// Audio height is fixed by the native controls, so only `fullWidth` applies
const PropAudio = ({
  prop: { value: url, fullWidth, helperText, richText, propStyle = [] },
  sx = [],
}) => (
  <Box
    sx={[
      styles.root,
      fullWidth ? { width: '100%' } : defaultWidth,
      ...forceArray(sx),
      ...forceArray(propStyle),
    ]}
  >
    <Box
      component="audio"
      controls
      src={url}
      aria-label={labelText(helperText, richText)}
      sx={styles.audio}
    />
    {helperText && (
      <FormHelperText sx={{ pt: 0.75, pl: 1 }}>
        <RichLabel text={helperText} rich={richText === true} />
      </FormHelperText>
    )}
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
