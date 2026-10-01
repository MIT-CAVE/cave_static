import PropTypes from 'prop-types'
import { Children, cloneElement, useEffect, useRef, useState } from 'react'

const FlexibleContainer = ({ children }) => {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ height: 0, width: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (!entries || entries.length === 0) return
        const { height, width } = entries[entries.length - 1].contentRect
        if (height > 0 && width > 0) {
          setSize((prev) =>
            prev.height === height && prev.width === width
              ? prev
              : { height, width }
          )
        }
      })
    })
    observer.observe(container)
    return () => {
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        flex: '1 1 auto',
        overflow: 'hidden',
        minHeight: 0,
        height: '100%',
        width: '100%',
      }}
    >
      {size.height > 0 && size.width > 0
        ? cloneElement(Children.only(children), {
            style: {
              height: size.height,
              width: size.width,
            },
          })
        : null}
    </div>
  )
}

FlexibleContainer.propTypes = {
  children: PropTypes.node,
}

export default FlexibleContainer
