import { Box, ButtonGroup, Slider } from '@mui/material'
import * as R from 'ramda'
import { memo, useState, useMemo } from 'react'
import {
  MdAdd,
  MdFilterAlt,
  MdGpsFixed,
  MdHeight,
  MdRemove,
  Md360,
  MdHome,
  MdApps,
  MdMap,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { WithBadge } from './Legend'

import { mutateLocal } from '../../../data/local'
import {
  bearingSliderToggle,
  bearingUpdate,
  pitchSliderToggle,
  pitchUpdate,
  viewportUpdate,
  changeZoom,
  openMapModal,
  toggleMapLegend,
} from '../../../data/local/mapSlice'
import {
  selectDefaultViewportFunc,
  selectOptionalViewportsFunc,
  selectBearingSliderToggleFunc,
  selectPitchSliderToggleFunc,
  selectBearingFunc,
  selectPitchFunc,
  selectStaticMap,
  selectSync,
  selectLegendDataFunc,
} from '../../../data/selectors'
import {
  MAX_BEARING,
  MAX_PITCH,
  MIN_BEARING,
  MIN_PITCH,
} from '../../../utils/constants'
import { unitPlacements } from '../../../utils/enums'

import { FetchedIcon, TooltipButton } from '../../compound'

import { NumberFormat, getSliderMarks, includesPath } from '../../../utils'

const styles = {
  getRoot: (hover) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'end',
    position: 'absolute',
    bottom: '24px',
    right: '4px',
    zIndex: 1,
    maxWidth: 'calc(100% - 8px)',
    button: {
      width: '42px',
    },
    'button,.MuiSlider-root': {
      opacity: hover ? 1 : 0.8,
    },
  }),
  btnGroup: {
    bgcolor: 'background.paper',
  },
  mapControls: {
    maxHeight: (theme) => `calc(100% - ${theme.spacing(5.5)} - 28px)`,
    mb: 5.5,
    overflowY: 'auto',
  },
  rowButtons: {
    display: 'flex',
    width: '100%',
    columnGap: 1.5,
    overflowX: 'auto',
    // scrollbarGutter: 'stable',
    zIndex: 1,
  },
  pitch: {
    display: 'flex',
    justifyContent: 'end',
    position: 'relative',
    height: '100px',
    width: '88px',
    mt: 2,
    mb: 3,
  },
  pitchSlider: {
    mr: 1,
    '.MuiSlider-thumb': {
      height: '20px',
      width: '20px',
      border: '2px',
      borderColor: 'currentcolor',
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    '.MuiSlider-track': {
      width: '3px',
      borderRadius: 1,
    },
    '.MuiSlider-rail': {
      width: '3px',
      borderRadius: 1,
    },
    '.MuiSlider-markLabel': {
      left: 'auto',
      right: '36px',
    },
  },
  bearing: {
    position: 'absolute',
    right: '84px',
    bottom: '64px',
    width: '150px',
    zIndex: 1,
  },
  bearingSlider: {
    '& .MuiSlider-thumb': {
      height: 20,
      width: 20,
      border: 2,
      borderColor: 'currentcolor',
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    '& .MuiSlider-rail': {
      height: 3,
      borderRadius: '4px',
    },
  },
}

const tooltipTitles = {
  pitch: 'Map Control \u279C Adjust the map pitch',
  bearing: 'Map Control \u279C Rotate the map',
  zoomIn: 'Map Control \u279C Zoom in',
  zoomOut: 'Map Control \u279C Zoom out',
  defaultViewport: 'Map Viewport \u279C Go to default viewport',
  customViewports: 'Map Viewport \u279C See all viewports...',
  mapLegend: 'Map Legend \u279C Arcs, nodes & geo areas',
  mapStyles: "Map Style \u279C Choose from the map's styles",
  globeProjection: 'Projection \u279C Globe',
  mercatorProjection: 'Projection \u279C Mercator',
}

const MapNavButtons = memo(({ mapId }) => {
  const dispatch = useDispatch()
  return (
    <ButtonGroup
      sx={styles.btnGroup}
      orientation="vertical"
      variant="contained"
      size="small"
    >
      <TooltipButton
        title={tooltipTitles.pitch}
        onClick={() => dispatch(pitchSliderToggle(mapId))}
      >
        <MdHeight />
      </TooltipButton>
      <TooltipButton
        title={tooltipTitles.zoomIn}
        onClick={() => dispatch(changeZoom({ mapId, value: 0.5 }))}
      >
        <MdAdd />
      </TooltipButton>
      <TooltipButton
        title={tooltipTitles.zoomOut}
        onClick={() => dispatch(changeZoom({ mapId, value: -0.5 }))}
      >
        <MdRemove />
      </TooltipButton>
      <TooltipButton
        title={tooltipTitles.bearing}
        onClick={() => dispatch(bearingSliderToggle(mapId))}
      >
        <Md360 />
      </TooltipButton>
    </ButtonGroup>
  )
})

const MapControls = ({ allowProjections, mapId }) => {
  const [hover, setHover] = useState(false)
  const bearing = useSelector(selectBearingFunc)(mapId)
  const pitch = useSelector(selectPitchFunc)(mapId)
  const defaultViewport = useSelector(selectDefaultViewportFunc)(mapId)
  const optionalViewports = useSelector(selectOptionalViewportsFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const isStatic = useSelector(selectStaticMap)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const legendData = useSelector(selectLegendDataFunc)(mapId)
  const anyActiveFilter = useMemo(
    () =>
      R.pipe(
        R.values,
        R.chain(
          R.pipe(
            R.prop('data'),
            R.values,
            R.reject(R.prop('group')), // Filters are not applied to grouped nodes
            R.pluck('filters')
          )
        ),
        R.unnest,
        R.any(
          R.allPass([
            R.isNotNil,
            R.propOr(true, 'active'),
            R.propEq('rule', 'type'),
          ])
        )
      )(legendData),
    [legendData]
  )

  const syncProjection = !includesPath(R.values(sync), [
    'maps',
    'data',
    mapId,
    'currentProjection',
  ])

  const getDegreeFormat = (value) =>
    NumberFormat.format(value, {
      unit: 'º',
      precision: 0,
      unitPlacement: unitPlacements.AFTER,
    })

  return (
    <>
      {/* Map controls */}
      <Box
        sx={[styles.getRoot(hover), styles.mapControls]}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {showPitchSlider && (
          <Box sx={styles.pitch}>
            <Slider
              sx={styles.pitchSlider}
              min={MIN_PITCH}
              max={MAX_PITCH}
              orientation="vertical"
              value={pitch}
              valueLabelDisplay="auto"
              valueLabelFormat={getDegreeFormat}
              marks={getSliderMarks(MIN_PITCH, MAX_PITCH, 2, getDegreeFormat)}
              onChange={(_, value) => dispatch(pitchUpdate({ mapId, value }))}
            />
          </Box>
        )}
        {isStatic ? [] : <MapNavButtons mapId={mapId} />}
      </Box>
      <Box
        sx={styles.getRoot(hover)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Box sx={styles.rowButtons}>
          {/* Map legend */}
          <ButtonGroup
            sx={styles.btnGroup}
            aria-label="contained button group"
            variant="contained"
          >
            <TooltipButton
              title={tooltipTitles.mapLegend}
              placement="top"
              onClick={() => dispatch(toggleMapLegend(mapId))}
            >
              <WithBadge
                size={14}
                color="#29b6f6"
                showBadge={anyActiveFilter}
                reactIcon={() => <MdFilterAlt color="#4a4a4a" />}
                overlap="rectangular"
                sx={{ top: '4px', right: '2px' }}
              >
                <MdApps
                  style={
                    // Adjusting position to compensate for the badge's top-right placement
                    { marginTop: '-4px', marginRight: '-2px' }
                  }
                />
              </WithBadge>
            </TooltipButton>
          </ButtonGroup>

          {/* Map styles */}
          <ButtonGroup
            sx={styles.btnGroup}
            aria-label="contained button group"
            variant="contained"
          >
            <TooltipButton
              title={tooltipTitles.mapStyles}
              placement="top"
              onClick={() =>
                dispatch(openMapModal({ feature: 'mapStyles', mapId }))
              }
            >
              <MdMap />
            </TooltipButton>
          </ButtonGroup>
          {/* Projection */}
          {allowProjections && (
            <ButtonGroup sx={styles.btnGroup} variant="contained">
              <TooltipButton
                title={tooltipTitles.globeProjection}
                placement="top"
                onClick={() =>
                  dispatch(
                    mutateLocal({
                      path: ['maps', 'data', mapId, 'currentProjection'],
                      value: 'globe',
                      sync: syncProjection,
                    })
                  )
                }
              >
                <FetchedIcon iconName="bs/BsGlobe2" />
              </TooltipButton>
              <TooltipButton
                title={tooltipTitles.mercatorProjection}
                placement="top"
                onClick={() => {
                  dispatch(
                    mutateLocal({
                      path: ['maps', 'data', mapId, 'currentProjection'],
                      value: 'mercator',
                      sync: syncProjection,
                    })
                  )
                }}
              >
                <FetchedIcon iconName="bs/BsMap" />
              </TooltipButton>
            </ButtonGroup>
          )}

          {/* Map viewports */}
          <ButtonGroup sx={styles.btnGroup} variant="contained">
            {!R.anyPass([R.isEmpty, R.isNil])(optionalViewports) && (
              <TooltipButton
                title={tooltipTitles.customViewports}
                placement="top"
                onClick={() =>
                  dispatch(openMapModal({ feature: 'viewports', mapId }))
                }
              >
                <MdGpsFixed />
              </TooltipButton>
            )}
            <TooltipButton
              title={tooltipTitles.defaultViewport}
              placement="bottom-start"
              onClick={() => {
                dispatch(viewportUpdate({ viewport: defaultViewport, mapId }))
              }}
            >
              <MdHome />
            </TooltipButton>
          </ButtonGroup>
        </Box>
      </Box>

      {showBearingSlider && (
        <Box sx={styles.bearing}>
          <Slider
            sx={styles.bearingSlider}
            min={MIN_BEARING}
            max={MAX_BEARING}
            value={bearing}
            track={false}
            valueLabelDisplay="auto"
            valueLabelFormat={getDegreeFormat}
            marks={getSliderMarks(MIN_BEARING, MAX_BEARING, 5, getDegreeFormat)}
            onChange={(_, value) => dispatch(bearingUpdate({ mapId, value }))}
          />
        </Box>
      )}
    </>
  )
}

export default memo(MapControls)
