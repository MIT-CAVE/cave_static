import { Box, ButtonGroup, Slider } from '@mui/material'
import * as R from 'ramda'
import { memo, useState, useMemo, useCallback, useEffect } from 'react'
import { BsGlobe2 } from 'react-icons/bs'
import { FaMapMarkedAlt } from 'react-icons/fa'
import {
  MdAdd,
  MdFilterAlt,
  MdGpsFixed,
  MdHeight,
  MdRemove,
  Md360,
  MdHome,
  MdApps,
} from 'react-icons/md'
import { PiPerspectiveBold } from 'react-icons/pi'
import { TbMap } from 'react-icons/tb'
import { useSelector } from 'react-redux'

import { WithBadge } from './Legend'
import useMapApi from './useMapApi'

import {
  selectDefaultViewportFunc,
  selectOptionalViewportsFunc,
  selectBearingSliderToggleFunc,
  selectPitchSliderToggleFunc,
  selectBearingFunc,
  selectPitchFunc,
  selectStaticMap,
  selectLegendDataFunc,
  selectMapProjectionOptionsFunc,
  selectLockMapProjectionFunc,
  selectLockMapStyleFunc,
  selectViewportsByMap,
  selectIsMapLegendOpenFunc,
  selectMapModal,
} from '../../../data/selectors'
import {
  MAX_BEARING,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_BEARING,
  MIN_PITCH,
  MIN_ZOOM,
} from '../../../utils/constants'
import { MAP_PROJECTIONS, unitPlacements } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'

import { TooltipButton } from '../../compound'

import { NumberFormat, forcePath, getSliderMarks } from '../../../utils'

const LIGHT_SLIDER_COLOR = '#0288d1'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'end',
    position: 'absolute',
    bottom: '24px',
    right: '4px',
    zIndex: 1,
    maxWidth: 'calc(100% - 8px)',
    button: { width: '42px' },
  },
  btnGroup: {
    bgcolor: 'background.paper',
    borderRadius: 1,
    '&> :first-child button': {
      borderTopLeftRadius: '4px',
      borderBottomLeftRadius: '4px',
    },
    '&> :last-child button': {
      borderTopRightRadius: '4px',
      borderBottomRightRadius: '4px',
    },
  },
  btnGroupVert: {
    bgcolor: 'background.paper',
    borderRadius: 1,
    '&> :first-child button': {
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
    },
    '&> :last-child button': {
      borderBottomLeftRadius: '4px',
      borderBottomRightRadius: '4px',
    },
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
      height: '20px',
      width: '20px',
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
  lightSlider: {
    '.MuiSlider-track': { color: LIGHT_SLIDER_COLOR },
    '.MuiSlider-thumb': { color: LIGHT_SLIDER_COLOR },
    '.MuiSlider-rail': { color: LIGHT_SLIDER_COLOR },
    '.MuiSlider-markLabel': { color: 'rgba(0 0 0 / .87)' },
    '& .MuiSlider-thumb': {
      '&:hover': {
        boxShadow: `0 0 0 8px ${LIGHT_SLIDER_COLOR}0f`,
      },
      '&:active': {
        boxShadow: `0 0 0 14px ${LIGHT_SLIDER_COLOR}0f`,
      },
    },
  },
}

const tooltipTitles = {
  pitch: 'Adjust map pitch (tilt the view)',
  bearing: 'Rotate the map',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  defaultViewport: 'Reset to default map view',
  customViewports: 'Show all viewports',
  mapLegend: 'Toggle Legend \u279C Arcs, Nodes & Geo areas',
  mapStyles: 'Change map style',
  globeProjection: 'Switch to Globe projection',
  mercatorProjection: 'Switch to Mercator projection',
  otherProjections: 'Choose another map projection',
}

const MapButton = ({ icon: Icon, ...props }) => (
  <TooltipButton {...props}>
    <Icon size={24} />
  </TooltipButton>
)

const MapNavButtons = memo(({ mapId, createHandleChangeMapControl }) => {
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const viewport = useSelector(selectViewportsByMap)[mapId]

  const handleClickPitchToggle = useCallback(
    () =>
      createHandleChangeMapControl({
        value: !showPitchSlider,
        pathTail: 'showPitchSlider',
        sync: false, // Keep sync local for now
      }),
    [createHandleChangeMapControl, showPitchSlider]
  )

  const handleClickBearingToggle = useCallback(
    () =>
      createHandleChangeMapControl({
        value: !showBearingSlider,
        pathTail: 'showBearingSlider',
        sync: false, // Keep sync local for now
      }),
    [createHandleChangeMapControl, showBearingSlider]
  )

  const changeZoom = useMutateStateWithSync(
    (value) => {
      const minZoom = R.clamp(MIN_ZOOM, MAX_ZOOM, viewport.minZoom ?? MIN_ZOOM)
      const maxZoom = R.clamp(minZoom, MAX_ZOOM, viewport.maxZoom ?? MAX_ZOOM)
      const currentZoom = viewport.zoom ?? minZoom
      const zoom = R.pipe(R.add(currentZoom), R.clamp(minZoom, maxZoom))(value)
      return {
        path: ['maps', 'data', mapId, 'mapControls', 'viewport', 'zoom'],
        value: zoom,
      }
    },
    [mapId, viewport.maxZoom, viewport.minZoom, viewport.zoom]
  )

  const handleClickZoomIn = useCallback(() => {
    changeZoom(0.5)
  }, [changeZoom])

  const handleClickZoomOut = useCallback(() => {
    changeZoom(-0.5)
  }, [changeZoom])

  return (
    <ButtonGroup
      sx={styles.btnGroupVert}
      orientation="vertical"
      variant="contained"
      size="small"
    >
      <MapButton
        title={tooltipTitles.pitch}
        icon={MdHeight}
        onClick={handleClickPitchToggle}
      />
      <MapButton
        title={tooltipTitles.zoomIn}
        icon={MdAdd}
        onClick={handleClickZoomIn}
      />
      <MapButton
        title={tooltipTitles.zoomOut}
        icon={MdRemove}
        onClick={handleClickZoomOut}
      />
      <MapButton
        title={tooltipTitles.bearing}
        icon={Md360}
        onClick={handleClickBearingToggle}
      />
    </ButtonGroup>
  )
})

const MapControls = ({ mapId }) => {
  const [hover, setHover] = useState(false)
  const { isMapboxSelected, isDarkStyle } = useMapApi(mapId)

  const bearing = useSelector(selectBearingFunc)(mapId)
  const pitch = useSelector(selectPitchFunc)(mapId)
  const lockMapProjection = useSelector(selectLockMapProjectionFunc)(mapId)
  const lockMapStyle = useSelector(selectLockMapStyleFunc)(mapId)
  const defaultViewport = useSelector(selectDefaultViewportFunc)(mapId)
  const optionalViewports = useSelector(selectOptionalViewportsFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const mapProjectionOptions = useSelector(selectMapProjectionOptionsFunc)(
    mapId
  )
  const legendData = useSelector(selectLegendDataFunc)(mapId)
  const isMapLegendOpen = useSelector(selectIsMapLegendOpenFunc)(mapId)
  const mapModal = useSelector(selectMapModal)
  const isStatic = useSelector(selectStaticMap)

  const [currentBearing, setCurrentBearing] = useState(bearing)
  const [currentPitch, setCurrentPitch] = useState(pitch)

  useEffect(() => {
    setCurrentPitch(pitch)
  }, [pitch])

  useEffect(() => {
    setCurrentBearing(bearing)
  }, [bearing])

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

  const getDegreeFormat = (value) =>
    NumberFormat.format(value, {
      unit: 'º',
      precision: 0,
      unitPlacement: unitPlacements.AFTER,
    })

  const rootStyle = useMemo(
    () => [
      styles.root,
      !isMapboxSelected && { bottom: '40px' },
      { 'button,.MuiSlider-root': { opacity: hover ? 1 : 0.8 } },
    ],
    [hover, isMapboxSelected]
  )

  const handleClickMapLegendToggle = useMutateStateWithSync(
    () => ({
      path: ['maps', 'data', mapId, 'mapLegend', 'isOpen'],
      value: !isMapLegendOpen,
      sync: false, // Keep sync local for now
    }),
    [isMapLegendOpen, mapId]
  )

  const handleClickDefaultViewport = useMutateStateWithSync(() => {
    const minZoom = R.clamp(
      MIN_ZOOM,
      MAX_ZOOM,
      defaultViewport.minZoom ?? MIN_ZOOM
    )
    const maxZoom = R.clamp(
      minZoom,
      MAX_ZOOM,
      defaultViewport.maxZoom ?? MAX_ZOOM
    )
    const zoom = R.clamp(minZoom, maxZoom, defaultViewport.zoom ?? 0)
    const clampedViewport = R.assoc('zoom', zoom)(defaultViewport)
    return {
      path: ['maps', 'data', mapId, 'mapControls', 'viewport'],
      value: R.mergeRight(defaultViewport)(clampedViewport),
    }
  }, [mapId])

  const createHandleChangeMapControl = useMutateStateWithSync(
    ({ value, pathTail, ...args }) => ({
      path: ['maps', 'data', mapId, 'mapControls', ...forcePath(pathTail)],
      value,
      ...args,
    }),
    [mapId]
  )

  const createHandleChangeProjection = useMutateStateWithSync(
    (projection) => ({
      path: ['maps', 'data', mapId, 'currentProjection'],
      value: projection,
    }),
    [mapId]
  )

  const handleChangePitch = useCallback((event, value) => {
    setCurrentPitch(value)
  }, [])
  const handleChangeBearing = useCallback((event, value) => {
    setCurrentBearing(value)
  }, [])

  const handleChangeBearingCommitted = useCallback(
    (event, value) => {
      createHandleChangeMapControl({ value, pathTail: ['viewport', 'bearing'] })
    },
    [createHandleChangeMapControl]
  )

  const handleChangePitchCommitted = useCallback(
    (event, value) => {
      createHandleChangeMapControl({ value, pathTail: ['viewport', 'pitch'] })
    },
    [createHandleChangeMapControl]
  )

  const handleClickGlobeProjection = useCallback(() => {
    createHandleChangeProjection(MAP_PROJECTIONS.GLOBE)
  }, [createHandleChangeProjection])

  const handleClickMercatorProjection = useCallback(() => {
    createHandleChangeProjection(MAP_PROJECTIONS.MERCATOR)
  }, [createHandleChangeProjection])

  const createHandleClickModal = useMutateStateWithSync(
    (feature) => ({
      path: ['maps', 'mapModal'],
      value: R.mergeLeft({ data: { feature, mapId }, isOpen: true })(mapModal),
      sync: false, // Keep sync local for now
    }),
    [mapId, mapModal]
  )

  const handleClickMapProjectionsModal = useCallback(() => {
    createHandleClickModal('mapProjections')
  }, [createHandleClickModal])

  const handleClickMapStylesModal = useCallback(() => {
    createHandleClickModal('mapStyles')
  }, [createHandleClickModal])

  const handleClickViewportsModal = useCallback(() => {
    createHandleClickModal('viewports')
  }, [createHandleClickModal])

  const hasAnyOptionalViewport = useMemo(
    () => !R.anyPass([R.isEmpty, R.isNil])(optionalViewports),
    [optionalViewports]
  )

  return (
    <>
      {/* Map controls */}
      <Box
        sx={[...rootStyle, styles.mapControls]}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {showPitchSlider && (
          <Box sx={styles.pitch}>
            <Slider
              sx={[styles.pitchSlider, !isDarkStyle && styles.lightSlider]}
              min={MIN_PITCH}
              max={MAX_PITCH}
              orientation="vertical"
              value={currentPitch}
              valueLabelDisplay="auto"
              valueLabelFormat={getDegreeFormat}
              marks={getSliderMarks(MIN_PITCH, MAX_PITCH, 2, getDegreeFormat)}
              onChange={handleChangePitch}
              onChangeCommitted={handleChangePitchCommitted}
            />
          </Box>
        )}
        {isStatic ? (
          []
        ) : (
          <MapNavButtons {...{ mapId, createHandleChangeMapControl }} />
        )}
      </Box>
      <Box
        sx={rootStyle}
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
            <MapButton
              icon={
                anyActiveFilter
                  ? () => (
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
                    )
                  : MdApps
              }
              title={tooltipTitles.mapLegend}
              placement="auto"
              onClick={handleClickMapLegendToggle}
            />
          </ButtonGroup>

          {/* Projection */}
          {!lockMapProjection && (
            <ButtonGroup sx={styles.btnGroup} variant="contained">
              <MapButton
                icon={BsGlobe2}
                title={tooltipTitles.globeProjection}
                placement="top"
                onClick={handleClickGlobeProjection}
              />
              <MapButton
                icon={FaMapMarkedAlt}
                title={tooltipTitles.mercatorProjection}
                placement="top"
                onClick={handleClickMercatorProjection}
              />
              {R.isNotEmpty(mapProjectionOptions) && (
                <MapButton
                  icon={PiPerspectiveBold}
                  title={tooltipTitles.otherProjections}
                  placement="top"
                  onClick={handleClickMapProjectionsModal}
                />
              )}
            </ButtonGroup>
          )}

          {/* Map styles */}
          {!lockMapStyle && (
            <ButtonGroup
              sx={styles.btnGroup}
              aria-label="contained button group"
              variant="contained"
            >
              <MapButton
                icon={TbMap}
                title={tooltipTitles.mapStyles}
                placement="top"
                onClick={handleClickMapStylesModal}
              />
            </ButtonGroup>
          )}

          {/* Map viewports */}
          <ButtonGroup sx={styles.btnGroup} variant="contained">
            {hasAnyOptionalViewport && (
              <MapButton
                icon={MdGpsFixed}
                title={tooltipTitles.customViewports}
                placement="top"
                onClick={handleClickViewportsModal}
              />
            )}
            <MapButton
              icon={MdHome}
              title={tooltipTitles.defaultViewport}
              placement="auto"
              onClick={handleClickDefaultViewport}
            />
          </ButtonGroup>
        </Box>
      </Box>

      {showBearingSlider && (
        <Box sx={[styles.bearing, !isMapboxSelected && { bottom: '80px' }]}>
          <Slider
            sx={[styles.bearingSlider, !isDarkStyle && styles.lightSlider]}
            min={MIN_BEARING}
            max={MAX_BEARING}
            value={currentBearing}
            track={false}
            valueLabelDisplay="auto"
            valueLabelFormat={getDegreeFormat}
            marks={getSliderMarks(MIN_BEARING, MAX_BEARING, 5, getDegreeFormat)}
            onChange={handleChangeBearing}
            onChangeCommitted={handleChangeBearingCommitted}
          />
        </Box>
      )}
    </>
  )
}

export default memo(MapControls)
