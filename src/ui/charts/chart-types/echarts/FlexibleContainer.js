import PropTypes from 'prop-types'
import {
  Children,
  cloneElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

const FlexibleContainer = ({ children, onResize }) => {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ height: 0, width: 0 })
  const rafRef = useRef(null)
  const timeoutRef = useRef(null)

  const updateSize = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const width = Math.floor(container.clientWidth || rect.width)
    const height = Math.floor(container.clientHeight || rect.height)
    if (height > 0 && width > 0) {
      setSize((prev) => {
        if (prev.height === height && prev.width === width) return prev
        return { height, width }
      })
      onResize?.({ height, width })
    }
  }, [onResize])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    updateSize()

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateSize)
    })
    observer.observe(container)

    const handleWindowResize = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateSize)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(updateSize, 250)
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timeoutRef.current)
      observer.disconnect()
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [updateSize])

  return (
    <div
      ref={containerRef}
      style={{
        flex: '1 1 auto',
        overflow: 'hidden',
        minHeight: 0,
        minWidth: 0,
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
  onResize: PropTypes.func,
}

export default FlexibleContainer
