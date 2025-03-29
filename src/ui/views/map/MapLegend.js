import { memo } from 'react'
import { useSelector } from 'react-redux'

import CompactLegend from './CompactLegend'
import FullLegend from './FullLegend'

import {
  selectLegendView,
  selectIsMapLegendOpenFunc,
} from '../../../data/selectors'
import { legendViews } from '../../../utils/enums'

const MapLegend = ({ mapId }) => {
  const isMapLegendOpen = useSelector(selectIsMapLegendOpenFunc)(mapId)
  const legendView = useSelector(selectLegendView)[mapId]

  if (!isMapLegendOpen) return null

  const LegendView =
    legendView === legendViews.FULL ? FullLegend : CompactLegend

  return <LegendView {...{ mapId }} />
}

export default memo(MapLegend)
