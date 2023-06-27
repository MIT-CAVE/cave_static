import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
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

  const divRef = useCallback((node) => {
    if (node == null) return

    const overflowX = node.offsetWidth < node.scrollWidth
    const overflowY = node.offsetHeight < node.scrollHeight
    setIsOverflowing(overflowX || overflowY)
  }, [])
  return (
    <Box sx={[styles.root, ...forceArray(sx)]} ref={divRef} {...props}>
      {isOverflowing ? (
        <Marquee
          direction="left"
          delay={0.5}
          gradient={false}
          pauseOnHover
          {...{ speed }}
        >
          <Box sx={styles.marqueeContent}>{children || text}</Box>
        </Marquee>
      ) : (
        <>{children || text}</>
      )}
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
