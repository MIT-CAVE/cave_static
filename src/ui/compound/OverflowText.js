import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import Marquee from 'react-fast-marquee'

const OverflowText = ({ text, speed = 20 }) => {
  const [isOverflowing, setIsOverflowing] = useState(false)

  const divRef = useCallback((node) => {
    if (node == null) return

    const overflowX = node.offsetWidth < node.scrollWidth
    const overflowY = node.offsetHeight < node.scrollHeight
    setIsOverflowing(overflowX || overflowY)
  }, [])
  return (
    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }} ref={divRef}>
      {isOverflowing ? (
        <Marquee
          direction="left"
          delay={0.5}
          gradient={false}
          pauseOnHover
          {...{ speed }}
        >
          <Box sx={{ pr: 6 }}>{text}</Box>
        </Marquee>
      ) : (
        <>{text}</>
      )}
    </div>
  )
}
OverflowText.propTypes = {
  text: PropTypes.string,
  speed: PropTypes.number,
}

export default OverflowText
