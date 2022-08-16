/** @jsxImportSource @emotion/react */
import * as R from 'ramda'
import React, { useCallback, useRef } from 'react'
import Marquee from 'react-double-marquee'

export const OverflowText = ({ css, text, speed = 0.02 }) => {
  const divRef = useRef(false)

  const isOverflow = useCallback((e) => {
    if (R.has('offsetHeight', e)) return false
    return e.offsetHeight < e.scrollHeight || e.offsetWidth < e.scrollWidth
  }, [])

  return (
    <div
      css={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        ...css,
      }}
      ref={(ref) => (divRef.current = ref)}
    >
      {isOverflow(divRef.current) ? (
        <Marquee
          direction="left"
          speed={speed}
          childMargin={40}
          css={{ overflowY: 'hidden' }}
        >
          {text}
        </Marquee>
      ) : (
        <span>{text}</span>
      )}
    </div>
  )
}
