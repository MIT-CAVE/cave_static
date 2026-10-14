import { Box, Dialog, FormHelperText } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useEffect, useRef, useState } from 'react'

import RippleBox from './RippleBox'

import { forceArray } from '../../utils'

const DEFAULT_MAX_SIZE = 300

const imgBase = {
  display: 'block',
  border: '1px solid rgb(128 128 128)',
  boxSizing: 'border-box',
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  frame: {
    flex: '1 1 auto',
    minHeight: 0,
    position: 'relative',
  },
  // Sized imperatively by the effect in `PropPicture`
  coverFrame: {
    flex: 'none',
    position: 'relative',
  },
  // Default size when neither `scaleMode` nor `fullWidth` is set: the box
  // hugs the image, which is capped to DEFAULT_MAX_SIZE keeping its ratio
  defaultRoot: {
    width: 'fit-content',
    maxWidth: `min(100%, ${DEFAULT_MAX_SIZE}px)`,
  },
  defaultImg: {
    ...imgBase,
    height: 'auto',
    width: 'auto',
    maxWidth: DEFAULT_MAX_SIZE,
    maxHeight: DEFAULT_MAX_SIZE,
  },
  coverImg: {
    ...imgBase,
    height: '100%',
    width: '100%',
  },
}

// The container keeps one dimension and follows the image on the other one.
// It depends on the available cell, so it is computed in JS (see the effect).
const scaleModeRootStyles = {
  fitWidth: { width: '100%' },
  fitHeight: { width: 'fit-content' },
  fitContainer: { width: '100%' },
}

const PropPicture = ({
  prop: { value: url, scaleMode, fullWidth, helperText, propStyle },
  sx = [],
}) => {
  const [expanded, setExpanded] = useState(false)
  const [natural, setNatural] = useState(null)
  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const helperRef = useRef(null)

  // `scaleMode` takes precedence over `fullWidth`, which is equivalent to `fitWidth`
  const mode = scaleMode ?? (fullWidth ? 'fitWidth' : undefined)
  const isScaled = mode in scaleModeRootStyles

  // `fitWidth`/`fitHeight` keep one side of the available cell and the container
  // follows the image on the other. `fitContainer` is a cover scale without
  // cropping: the side that binds matches the cell, the other one grows. The cell is
  // measured with the frame collapsed so the result never depends on a
  // previous expansion (no feedback loop, and it can shrink back).
  useEffect(() => {
    const root = rootRef.current
    const frame = frameRef.current
    const parent = root?.parentElement
    if (!isScaled || !natural || !parent) return
    const layout = () => {
      frame.style.width = '0px'
      frame.style.height = '0px'
      root.style.minWidth = '0px'
      const parentStyle = getComputedStyle(parent)
      const width =
        parent.clientWidth -
        parseFloat(parentStyle.paddingLeft) -
        parseFloat(parentStyle.paddingRight)
      const height =
        parent.clientHeight -
        parseFloat(parentStyle.paddingTop) -
        parseFloat(parentStyle.paddingBottom) -
        (helperRef.current?.offsetHeight ?? 0)
      const widthScale = width / natural.width
      const heightScale = Math.max(height, 0) / natural.height
      // Without a definite cell height, fall back to the width
      const scale = R.cond([
        [R.equals('fitWidth'), R.always(widthScale)],
        [R.equals('fitHeight'), R.always(heightScale || widthScale)],
        [R.T, R.always(Math.max(widthScale, heightScale))],
      ])(mode)
      const imgWidth = natural.width * scale
      frame.style.width = `${imgWidth}px`
      frame.style.height = `${natural.height * scale}px`
      root.style.minWidth = `${imgWidth}px`
    }
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(parent)
    return () => {
      observer.disconnect()
      frame.style.width = ''
      frame.style.height = ''
      root.style.minWidth = ''
    }
  }, [mode, isScaled, natural])

  return (
    <>
      <Box
        ref={rootRef}
        sx={[
          styles.root,
          scaleModeRootStyles[mode] ?? styles.defaultRoot,
          ...forceArray(sx),
          ...forceArray(propStyle),
        ]}
      >
        <Box ref={frameRef} sx={isScaled ? styles.coverFrame : styles.frame}>
          <RippleBox
            sx={isScaled && { width: '100%', height: '100%' }}
            onClick={() => {
              setExpanded(true)
            }}
          >
            <img
              src={url}
              alt={helperText ?? ''}
              style={isScaled ? styles.coverImg : styles.defaultImg}
              onLoad={({ target }) => {
                setNatural({
                  width: target.naturalWidth,
                  height: target.naturalHeight,
                })
              }}
            />
          </RippleBox>
        </Box>
        {helperText && (
          <FormHelperText ref={helperRef}>{helperText}</FormHelperText>
        )}
      </Box>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={expanded}
        onClose={() => {
          setExpanded(false)
        }}
      >
        <img src={url} alt={helperText ?? ''} />
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
