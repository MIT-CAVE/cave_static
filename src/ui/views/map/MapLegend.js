import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import ClassicLegend from './ClassicLegend'
import MinimalLegend from './MinimalLegend'

import {
  selectBearingSliderToggleFunc,
  selectMapLegendFunc,
  selectPitchSliderToggleFunc,
} from '../../../data/selectors'

const rootStyle = {
  position: 'absolute',
  top: '8px',
  zIndex: 1,
  overflow: 'auto',
  // scrollbarGutter: 'stable',
}

const MapLegend = ({ mapId, containerRef }) => {
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const mapLegend = useSelector(selectMapLegendFunc)(mapId)
  const [classicView, setClassicView] = useState(false)

  const handleChangeView = useCallback(
    () => setClassicView(!classicView),
    [classicView]
  )

  if (!R.propOr(true, 'isOpen', mapLegend)) return null

  const LegendView = classicView ? ClassicLegend : MinimalLegend
  return (
    <Box
      key="map-legend"
      sx={[
        rootStyle,
        {
          right: showPitchSlider ? 98 : 64,
          maxHeight: showBearingSlider
            ? 'calc(100% - 165px)'
            : 'calc(100% - 88px)',
          maxWidth: showPitchSlider
            ? 'calc(100% - 106px)'
            : 'calc(100% - 80px)',
        },
      ]}
    >
      <LegendView
        {...{ mapId, containerRef }}
        onChangeView={handleChangeView}
      />
    </Box>
  )
}

export default memo(MapLegend)
