import { createContext, useMemo } from 'react'
import {
  Map as ReactMapboxGL,
  NavigationControl as MapboxNavCtrl,
  Marker as MapboxMarker,
  Layer as MapboxLayer,
  Source as MapboxSource,
  // eslint-disable-next-line import/no-unresolved
} from 'react-map-gl/mapbox'
import { useSelector } from 'react-redux'

import {
  selectCurrentMapStyleIdFunc,
  selectMapStyleOptions,
} from '../../../data/selectors'
import { DARK_GLOBE_FOG, LIGHT_GLOBE_FOG } from '../../../utils/constants'

import { normalizeFog } from '../../../utils'

export const MapContext = createContext({
  mapId: null,
  mapRef: null,
  containerRef: null,
})

const useMapApi = (mapId) => {
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const currentMapStyleId = useSelector(selectCurrentMapStyleIdFunc)(mapId)

  const mapStyleOption = mapStyleOptions[currentMapStyleId]
  const mapStyle = mapStyleOption?.spec

  const isDarkStyle = useMemo(() => {
    const styleIdLower = currentMapStyleId?.toLowerCase()
    const styleName = mapStyleOption?.name?.toLowerCase()
    return !(
      mapStyleOption?.light ||
      styleName?.includes('light') ||
      styleName?.includes('day') ||
      styleIdLower?.includes('light') ||
      styleIdLower?.includes('day')
    )
  }, [currentMapStyleId, mapStyleOption?.light, mapStyleOption?.name])

  const fog = useMemo(() => {
    const defaultFog = isDarkStyle ? DARK_GLOBE_FOG : LIGHT_GLOBE_FOG
    const rawFog = mapStyleOption?.fog ?? mapStyle?.fog ?? defaultFog
    return normalizeFog(rawFog)
  }, [isDarkStyle, mapStyle?.fog, mapStyleOption?.fog])

  return useMemo(
    () => ({
      mapStyle,
      mapStyleOption,
      fog,
      isDarkStyle,
      isMapboxSelected: true,
      ReactMapGl: ReactMapboxGL,
      NavigationControl: MapboxNavCtrl,
      Marker: MapboxMarker,
      Source: MapboxSource,
      Layer: MapboxLayer,
    }),
    [fog, isDarkStyle, mapStyle, mapStyleOption]
  )
}

export default useMapApi
