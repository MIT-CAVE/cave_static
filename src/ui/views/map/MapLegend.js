import { memo, useContext } from 'react'
import { useSelector } from 'react-redux'

import CompactLegend from './CompactLegend'
import FullLegend from './FullLegend'
import { MapContext } from './useMapApi'

import {
  selectLegendView,
  selectIsMapLegendOpenFunc,
} from '../../../data/selectors'
import { legendViews } from '../../../utils/enums'

const MapLegend = () => {
  const { mapId } = useContext(MapContext)

  const legendView = useSelector(selectLegendView)[mapId]
  const isMapLegendOpen = useSelector(selectIsMapLegendOpenFunc)(mapId)

  if (!isMapLegendOpen) return null

  const LegendView =
    legendView === legendViews.FULL ? FullLegend : CompactLegend

  return <LegendView />
}

export default memo(MapLegend)
