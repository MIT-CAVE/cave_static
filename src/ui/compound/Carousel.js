import { Box, IconButton } from '@mui/material'
import useEmblaCarousel from 'embla-carousel-react'
import PropTypes from 'prop-types'
import { useCallback, useEffect, useState } from 'react'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

import { forceArray } from '../../utils'

const styles = {
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    height: '100%',
  },
  viewport: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  container: {
    display: 'flex',
    gap: 1,
    height: '100%',
  },
  slide: {
    flex: '0 0 auto',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  fadeLeft: {
    left: 0,
    background: (theme) =>
      `linear-gradient(to right, ${theme.palette.background.paper}, transparent)`,
  },
  fadeRight: {
    right: 0,
    background: (theme) =>
      `linear-gradient(to left, ${theme.palette.background.paper}, transparent)`,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    bgcolor: 'background.paper',
    '&:hover': { bgcolor: 'background.paper' },
  },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
}

const Carousel = ({ children = [], sx = [] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    dragFree: true,
    containScroll: 'trimSnaps',
  })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((api) => {
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <Box sx={[styles.root, ...forceArray(sx)]}>
      {canScrollPrev && (
        <>
          <Box sx={[styles.fade, styles.fadeLeft]} />
          <IconButton
            size="small"
            sx={[styles.arrow, styles.arrowLeft]}
            onClick={scrollPrev}
          >
            <MdChevronLeft />
          </IconButton>
        </>
      )}
      <Box sx={styles.viewport} ref={emblaRef}>
        <Box sx={styles.container}>
          {children.map((child, index) => (
            <Box key={index} sx={styles.slide}>
              {child}
            </Box>
          ))}
        </Box>
      </Box>
      {canScrollNext && (
        <>
          <Box sx={[styles.fade, styles.fadeRight]} />
          <IconButton
            size="small"
            sx={[styles.arrow, styles.arrowRight]}
            onClick={scrollNext}
          >
            <MdChevronRight />
          </IconButton>
        </>
      )}
    </Box>
  )
}
Carousel.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default Carousel
