import { createContext, useMemo } from 'react'
import {
  Map as ReactMapboxGL,
  NavigationControl as MapboxNavCtrl,
  Marker as MapboxMarker,
  Layer as MapboxLayer,
  Source as MapboxSource,
  // eslint-disable-next-line import/no-unresolved
} from 'react-map-gl/mapbox'
import {
  Map as ReactMapLibreGL,
  NavigationControl as MapLibreNavCtrl,
  Marker as MapLibreMarker,
  Layer as MapLibreLayer,
  Source as MapLibreSource,
  // eslint-disable-next-line import/no-unresolved
} from 'react-map-gl/maplibre'
import { useSelector } from 'react-redux'

import {
  selectCurrentMapStyleIdFunc,
  selectIsCurrentMapboxStyleFunc,
  selectMapStyleOptions,
} from '../../../data/selectors'

export const MapContext = createContext({
  mapId: null,
  mapRef: null,
  containerRef: null,
})

const useMapApi = (mapId) => {
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const currentMapStyleId = useSelector(selectCurrentMapStyleIdFunc)(mapId)
  const isMapboxSelected = useSelector(selectIsCurrentMapboxStyleFunc)(mapId)

  const mapStyleOption = mapStyleOptions[currentMapStyleId]
  const mapStyle = mapStyleOption?.spec

  const isDarkStyle = useMemo(() => {
    const styleIdLower = currentMapStyleId?.toLowerCase()
    const styleName = mapStyleOption?.name.toLowerCase()
    return !(
      mapStyleOption?.light ||
      styleName?.includes('light') ||
      styleName?.includes('day') ||
      styleIdLower?.includes('light') ||
      styleIdLower?.includes('day')
    )
  }, [currentMapStyleId, mapStyleOption?.light, mapStyleOption?.name])

  return {
    mapStyle,
    mapStyleOption,
    isDarkStyle,
    isMapboxSelected,
    ReactMapGl: isMapboxSelected ? ReactMapboxGL : ReactMapLibreGL,
    NavigationControl: isMapboxSelected ? MapboxNavCtrl : MapLibreNavCtrl,
    Marker: isMapboxSelected ? MapboxMarker : MapLibreMarker,
    Source: isMapboxSelected ? MapboxSource : MapLibreSource,
    Layer: isMapboxSelected ? MapboxLayer : MapLibreLayer,
  }
}

export default useMapApi
