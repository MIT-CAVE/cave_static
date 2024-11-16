import { memo } from 'react'
import { useSelector } from 'react-redux'

import FullLegend from './FullLegend'
import MinimalLegend from './MinimalLegend'

import {
  selectLegendViewFunc,
  selectIsMapLegendOpenFunc,
} from '../../../data/selectors'
import { legendViews } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'

const MapLegend = ({ mapId }) => {
  const isMapLegendOpen = useSelector(selectIsMapLegendOpenFunc)(mapId)
  const legendView = useSelector(selectLegendViewFunc)(mapId)

  const handleChangeView = useMutateStateWithSync(() => {
    // Toggle between `full` and `minimal` legend views,
    // as these are the only available options for now.
    const newLegendView =
      legendView === legendViews.FULL ? legendViews.MINIMAL : legendViews.FULL
    return {
      path: ['maps', 'data', mapId, 'legendView'],
      value: newLegendView,
    }
  }, [mapId, legendView])

  const LegendView =
    legendView === legendViews.FULL
      ? FullLegend
      : legendView === legendViews.MINIMAL
        ? MinimalLegend
        : null

  if (!isMapLegendOpen) return null

  return <LegendView {...{ mapId }} onChangeView={handleChangeView} />
}

export default memo(MapLegend)
