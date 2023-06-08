import { Box, Button, Dialog } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const styles = {
  box: {
    display: 'flex',
    width: '100%',
    p: 1,
  },
  button: {
    marginLeft: '10px',
    height: '40px',
  },
  img: {
    width: '100%',
    minWith: '100px',
    maxWidth: '250px',
    height: '100%',
  },
  imgExpanded: {
    width: 'auto',
    height: 'auto',
  },
}

const PropPicture = ({ prop, sx = [], ...props }) => {
  const [expanded, setExpanded] = React.useState(false)
  const numberFormatDefault = useSelector(selectNumberFormat)

  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box
      sx={[styles.box, ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <img src={prop.value} alt="" style={styles.img} />
      <Button
        variant="contained"
        onClick={() => {
          setExpanded(true)
        }}
        sx={styles.button}
      >
        EXPAND
      </Button>
      <Dialog
        open={expanded}
        onClose={() => {
          setExpanded(false)
        }}
        maxWidth="lg"
        fullWidth="true"
      >
        <img src={prop.value} alt="" style={styles.imgExpanded} />
      </Dialog>
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
    </Box>
  )
}
PropPicture.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropPicture
