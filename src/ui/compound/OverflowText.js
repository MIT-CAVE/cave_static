import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from 'react'
import Marquee from 'react-fast-marquee'

import { forceArray } from '../../utils'

const styles = {
  root: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  marqueeContent: {
    pr: 6,
  },
}

const OverflowText = ({ text, speed = 20, sx = [], children, ...props }) => {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const checkedFalse = useRef(false)
  const parent = useRef(null)
  const node = useRef(null)

  const checkOverflow = useCallback((node) => {
    if (node === null) return
    const overflowX = node.offsetWidth < node.scrollWidth
    const overflowY = node.offsetHeight < node.scrollHeight
    setIsOverflowing(overflowX || overflowY)
  }, [])

  // if the text or parent size changes, check again for overflow
  useLayoutEffect(() => {
    checkedFalse.current = false
  }, [text, parent.offsetWidth, parent.offsetHeight])

  // This useEffect is needed to check if the text is overflowing.
  useEffect(() => {
    // if the non-scrolling text isn't rendered, try and see if it overflows
    if (node.current.scrollWidth === 0) {
      if (!checkedFalse.current) {
        // we only need to try once so keep track of that here
        checkedFalse.current = true
        setIsOverflowing(false)
      }
      return
    }
    // if the non-scrolling text is rendered, check if it overflows
    checkOverflow(node.current)
  }, [text, checkOverflow, isOverflowing])

  return (
    <Box sx={[styles.root, ...forceArray(sx)]} {...props} useRef={parent}>
      <Marquee
        direction="left"
        delay={0.5}
        gradient={false}
        pauseOnHover
        {...{ speed }}
        style={{ display: isOverflowing ? '' : 'none' }}
      >
        <Box sx={styles.marqueeContent}>{children || text}</Box>
      </Marquee>
      <Box style={{ display: isOverflowing ? 'none' : '' }} ref={node}>
        {children || text}
      </Box>
    </Box>
  )
}
OverflowText.propTypes = {
  text: PropTypes.string,
  speed: PropTypes.number,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  children: PropTypes.node,
}

export default OverflowText
