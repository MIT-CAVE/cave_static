import { Portal } from '@mui/material'
import { useContext } from 'react'

import { MapContext } from './useMapApi'

const MapPortal = ({ children }) => {
  const { containerRef } = useContext(MapContext)
  return (
    <Portal container={() => (containerRef ? containerRef.current : null)}>
      {children}
    </Portal>
  )
}

export default MapPortal
