import { createContext, useMemo } from 'react'
import {
  Map as ReactMapboxGL,
  NavigationControl as MapboxNavCtrl,
  Marker as MapboxMarker,
  Layer as MapboxLayer,
  Source as MapboxSource,
  MapProvider as MapboxProvider,
  // eslint-disable-next-line import/no-unresolved
} from 'react-map-gl/mapbox'
import {
  Map as ReactMapLibreGL,
  NavigationControl as MapLibreNavCtrl,
  Marker as MapLibreMarker,
  Layer as MapLibreLayer,
  Source as MapLibreSource,
  MapProvider as MapLibreProvider,
  // eslint-disable-next-line import/no-unresolved
} from 'react-map-gl/maplibre'
import { useSelector } from 'react-redux'

import {
  selectCurrentMapStyleIdFunc,
  selectMapStyleOptions,
} from '../../../data/selectors'
import { DARK_GLOBE_FOG, LIGHT_GLOBE_FOG } from '../../../utils/constants'

import { isMapboxStyle } from '../../../utils'

export const MapContext = createContext({
  mapId: null,
  mapRef: null,
  containerRef: null,
})

const useMapApi = (mapId) => {
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const currentMapStyleId = useSelector(selectCurrentMapStyleIdFunc)(mapId)

  const mapStyle = mapStyleOptions[currentMapStyleId]?.spec

  const isMapboxSelected = useMemo(() => isMapboxStyle(mapStyle), [mapStyle])

  const defaultFog = useMemo(() => {
    const styleIdLower = currentMapStyleId.toLowerCase()
    return styleIdLower.includes('light') || styleIdLower.includes('day')
      ? LIGHT_GLOBE_FOG
      : DARK_GLOBE_FOG
  }, [currentMapStyleId])

  return {
    mapStyle,
    defaultFog,
    isMapboxSelected,
    ReactMapGl: isMapboxSelected ? ReactMapboxGL : ReactMapLibreGL,
    MapProvider: isMapboxSelected ? MapboxProvider : MapLibreProvider,
    NavigationControl: isMapboxSelected ? MapboxNavCtrl : MapLibreNavCtrl,
    Marker: isMapboxSelected ? MapboxMarker : MapLibreMarker,
    Source: isMapboxSelected ? MapboxSource : MapLibreSource,
    Layer: isMapboxSelected ? MapboxLayer : MapLibreLayer,
  }
}

export default useMapApi
