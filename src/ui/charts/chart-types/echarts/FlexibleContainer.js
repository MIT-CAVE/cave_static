import PropTypes from 'prop-types'
import { Children, cloneElement, useEffect, useRef, useState } from 'react'

const FlexibleContainer = ({ children }) => {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ height: 1, width: 1 })
  const rafRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const { height, width } = entries[entries.length - 1].contentRect
        if (height > 0 && width > 0) setSize({ height, width })
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
      style={{ flex: '1 1 auto', overflow: 'hidden', minHeight: 0 }}
    >
      {cloneElement(Children.only(children), {
        style: { height: size.height, width: size.width },
      })}
    </div>
  )
}

FlexibleContainer.propTypes = {
  children: PropTypes.node,
}

export default FlexibleContainer
