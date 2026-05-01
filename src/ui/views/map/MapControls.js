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
import { useDispatch, useSelector } from 'react-redux'

import { WithBadge } from './Legend'
import useMapApi from './useMapApi'

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
  selectLegendDataFunc,
  selectMapProjectionOptionsFunc,
  selectLockMapProjectionFunc,
  selectLockMapStyleFunc,
} from '../../../data/selectors'
import {
  MAX_BEARING,
  MAX_PITCH,
  MIN_BEARING,
  MIN_PITCH,
} from '../../../utils/constants'
import { MAP_PROJECTIONS, unitPlacements } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'

import { TooltipButton } from '../../compound'

import { NumberFormat, getSliderMarks } from '../../../utils'

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

const MapNavButtons = memo(({ mapId }) => {
  const dispatch = useDispatch()

  const handleClickPitchToggle = useCallback(
    () => dispatch(pitchSliderToggle({ mapId, sync: false })),
    [dispatch, mapId]
  )

  const handleClickBearingToggle = useCallback(
    () => dispatch(bearingSliderToggle({ mapId, sync: false })),
    [dispatch, mapId]
  )

  const handleClickZoomIn = useCallback(() => {
    dispatch(changeZoom({ mapId, value: 0.5, sync: false }))
  }, [dispatch, mapId])

  const handleClickZoomOut = useCallback(() => {
    dispatch(changeZoom({ mapId, value: -0.5, sync: false }))
  }, [dispatch, mapId])

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
  const isStatic = useSelector(selectStaticMap)
  const dispatch = useDispatch()

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

  const handleClickMapLegendToggle = useCallback(
    () => dispatch(toggleMapLegend({ mapId, sync: false })),
    [dispatch, mapId]
  )

  const handleClickDefaultViewport = useCallback(
    () =>
      dispatch(
        viewportUpdate({ viewport: defaultViewport, mapId, sync: false })
      ),
    [defaultViewport, dispatch, mapId]
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
      dispatch(bearingUpdate({ mapId, value, sync: false }))
    },
    [dispatch, mapId]
  )

  const handleChangePitchCommitted = useCallback(
    (event, value) => {
      dispatch(pitchUpdate({ mapId, value, sync: false }))
    },
    [dispatch, mapId]
  )

  const handleClickGlobeProjection = useCallback(() => {
    createHandleChangeProjection(MAP_PROJECTIONS.GLOBE)
  }, [createHandleChangeProjection])

  const handleClickMercatorProjection = useCallback(() => {
    createHandleChangeProjection(MAP_PROJECTIONS.MERCATOR)
  }, [createHandleChangeProjection])

  const handleClickMapProjectionsModal = useCallback(() => {
    dispatch(openMapModal({ feature: 'mapProjections', mapId, sync: false }))
  }, [dispatch, mapId])

  const handleClickMapStylesModal = useCallback(() => {
    dispatch(openMapModal({ feature: 'mapStyles', mapId, sync: false }))
  }, [dispatch, mapId])

  const handleClickViewportsModal = useCallback(() => {
    dispatch(openMapModal({ feature: 'viewports', mapId, sync: false }))
  }, [dispatch, mapId])

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
        {isStatic ? [] : <MapNavButtons {...{ mapId }} />}
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
