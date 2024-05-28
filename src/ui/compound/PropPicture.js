import { Box, Button, Dialog } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { AiOutlineExpandAlt } from 'react-icons/ai'

import { forceArray } from '../../utils'

const styles = {
  box: {
    position: 'relative',
    width: '100%',
    p: 1,
  },
  button: {
    width: '36px',
    minWidth: 0,
    position: 'absolute',
    top: '15px',
    left: '15px',
    '.MuiButton-startIcon': {
      m: 0,
    },
  },
  img: {
    width: '100%',
    minWith: '100px',
    maxWidth: '300px',
    height: '100%',
  },
  imgExpanded: {
    width: 'auto',
    height: 'auto',
  },
}

const PropPicture = ({ prop, sx = [], ...props }) => {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <Box
      sx={[styles.box, ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <img src={prop.value} alt="" style={styles.img} />
      <Button
        variant="contained"
        startIcon={<AiOutlineExpandAlt />}
        onClick={() => {
          setExpanded(true)
        }}
        sx={styles.button}
      />
      <Dialog
        open={expanded}
        onClose={() => {
          setExpanded(false)
        }}
        maxWidth="lg"
        fullWidth
      >
        <img src={prop.value} alt="" style={styles.imgExpanded} />
      </Dialog>
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
