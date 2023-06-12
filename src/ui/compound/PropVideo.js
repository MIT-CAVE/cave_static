import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const styles = {
  box: {
    display: 'flex',
    width: '100%',
    p: 1,
  },
  video: {
    width: '100%',
    minWith: '100px',
    maxWidth: '300px',
    height: '100%',
  },
}

const PropVideo = ({ prop, sx = [], ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box
      sx={[styles.box, ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <iframe
        title="Embedded Video"
        src={prop.value}
        style={styles.video}
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
    </Box>
  )
}
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
