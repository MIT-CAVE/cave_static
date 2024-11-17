import { Portal } from '@mui/material'
import { createContext, useContext } from 'react'

export const MapContainerContext = createContext(null)

export const MapPortal = ({ children }) => {
  const containerRef = useContext(MapContainerContext)
  return (
    <Portal container={() => (containerRef ? containerRef.current : null)}>
      {children}
    </Portal>
  )
}

export default MapPortal
