import { memo } from 'react'
import { useSelector } from 'react-redux'

import FullLegend from './FullLegend'
import MinimalLegend from './MinimalLegend'

import {
  selectLegendViewFunc,
  selectIsMapLegendOpenFunc,
} from '../../../data/selectors'
import { legendViews } from '../../../utils/enums'

const MapLegend = ({ mapId }) => {
  const isMapLegendOpen = useSelector(selectIsMapLegendOpenFunc)(mapId)
  const legendView = useSelector(selectLegendViewFunc)(mapId)

  if (!isMapLegendOpen) return null

  const LegendView =
    legendView === legendViews.FULL
      ? FullLegend
      : legendView === legendViews.MINIMAL
        ? MinimalLegend
        : null

  return <LegendView {...{ mapId }} />
}

export default memo(MapLegend)
