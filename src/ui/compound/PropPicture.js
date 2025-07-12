import { Dialog } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

import RippleBox from './RippleBox'

import { forceArray } from '../../utils'

const styles = {
  root: {
    position: 'relative',
    height: '100%',
    maxHeight: '300px',
    width: '100%',
    minWidth: '200px',
    maxWidth: '300px',
  },
  img: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
    border: '1px solid rgb(128 128 128)',
    boxSizing: 'border-box',
  },
}

// TODO: Add `scaleMode` for flexible sizing (like in the `video` variant)
const PropPicture = ({ prop: { value: url, propStyle }, sx = [] }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <RippleBox
        sx={[styles.root, ...forceArray(sx), propStyle]}
        onClick={() => {
          setExpanded(true)
        }}
      >
        <img src={url} alt="" style={styles.img} />
      </RippleBox>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={expanded}
        onClose={() => {
          setExpanded(false)
        }}
      >
        <img src={url} alt="" />
      </Dialog>
    </>
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
