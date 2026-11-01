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
  },
  frame: {
    display: 'flex',
    flex: '1 1 auto',
    minHeight: 0,
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
  prop: {
    value: url,
    scaleMode,
    fullWidth,
    helperText,
    richText,
    propStyle = [],
  },
  sx = [],
}) => (
  <Box
    sx={[
      styles.root,
      // `scaleMode` takes precedence over `fullWidth`
      scaleModeStyles[scaleMode ?? (fullWidth ? 'fitWidth' : undefined)],
      ...forceArray(sx),
      ...forceArray(propStyle),
    ]}
  >
    <Box sx={styles.frame}>
      <iframe
        credentialless={true}
        title={labelText(helperText, richText) || 'Embedded Video'}
        src={url}
        style={styles.iframe}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; cross-origin-isolated"
      />
    </Box>
    {helperText && (
      <FormHelperText>
        <RichLabel text={helperText} rich={richText === true} />
      </FormHelperText>
    )}
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
