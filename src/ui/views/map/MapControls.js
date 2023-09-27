import { Box, ButtonGroup, IconButton, Slider, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState, useRef, useEffect, memo } from 'react'
import {
  MdAdd,
  MdGpsFixed,
  MdHeight,
  MdMap,
  MdRemove,
  Md360,
  MdApps,
  MdHome,
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayArrow,
  MdPause,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  bearingSliderToggle,
  bearingUpdate,
  pitchSliderToggle,
  pitchUpdate,
  viewportUpdate,
  changeZoom,
  toggleMapLegend,
  openMapModal,
} from '../../../data/local/mapSlice'
import { timeSelection, timeAdvance } from '../../../data/local/settingsSlice'
import {
  selectDefaultViewportFunc,
  selectOptionalViewportsFunc,
  selectBearingSliderToggleFunc,
  selectPitchSliderToggleFunc,
  selectBearingFunc,
  selectPitchFunc,
  selectCurrentTime,
  selectCurrentTimeUnits,
  selectCurrentTimeLength,
  selectStaticMap,
  selectSync,
} from '../../../data/selectors'
import {
  MAX_BEARING,
  MAX_PITCH,
  MIN_BEARING,
  MIN_PITCH,
} from '../../../utils/constants'
import { unitPlacements } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

import { NumberFormat, getSliderMarks, includesPath } from '../../../utils'

const styles = {
  getRoot: (hover) => ({
    'button,.MuiSlider-root': {
      opacity: hover ? 1 : 0.8,
    },
    button: {
      width: '48px',
    },
  }),
  rootBtns: {
    position: 'absolute',
    right: '4px',
    bottom: '24px',
    zIndex: 1,
    textAlign: 'right',
  },
  btnGroup: {
    bgcolor: 'background.paper',
  },
  mapControls: {
    mb: 5.5,
  },
  rowButtons: {
    display: 'flex',
    columnGap: 1.5,
    zIndex: 1,
  },
  tooltip: {
    '.MuiTooltip-tooltip': (theme) => ({
      maxWidth: 200,
      m: 1,
      ...theme.typography.caption,
    }),
  },
  iconButton: {
    p: 0.5,
    opacity: 1,
    borderRadius: 'inherit',
  },
  pitch: {
    position: 'relative',
    height: '100px',
    mb: 5,
    width: 'auto',
  },
  pitchSlider: {
    mr: 1,
    '.MuiSlider-thumb': {
      height: 20,
      width: 20,
      border: 2,
      borderColor: 'currentcolor',
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    '.MuiSlider-track': {
      width: 3,
      borderRadius: 1,
    },
    '.MuiSlider-rail': {
      width: 3,
      borderRadius: 1,
    },
    '.MuiSlider-markLabel': {
      left: 'auto',
      right: 36,
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

const TooltipButton = ({
  title,
  ariaLabel,
  placement = 'left',
  onClick,
  children,
  ...props
}) => (
  <Tooltip
    {...{ title, placement }}
    sx={styles.tooltip}
    aria-label={ariaLabel || title}
  >
    <span>
      <IconButton
        sx={styles.iconButton}
        {...{ onClick, ...props }}
        size="large"
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
)
TooltipButton.propTypes = {
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  placement: PropTypes.oneOf([
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top',
  ]),
  onClick: PropTypes.func,
  children: PropTypes.node,
}

const MapNavButtons = memo(({ mapId }) => {
  const dispatch = useDispatch()

  return (
    <ButtonGroup
      sx={[styles.btnGroup, styles.mapControls]}
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
  const [animation, setAnimation] = useState(false)
  const activeAnimation = useRef()

  const bearing = useSelector(selectBearingFunc)(mapId)
  const pitch = useSelector(selectPitchFunc)(mapId)
  const defaultViewport = useSelector(selectDefaultViewportFunc)(mapId)
  const optionalViewports = useSelector(selectOptionalViewportsFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const isStatic = useSelector(selectStaticMap)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

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

  // Ensures that animation stops if component is unmounted
  useEffect(() => {
    activeAnimation.current = animation
  }, [animation])
  useEffect(() => {
    return () => {
      clearInterval(activeAnimation.current)
    }
  }, [])

  const advanceAnimation = () => {
    dispatch(timeAdvance(timeLength))
  }

  return (
    <>
      {/* Map controls */}
      <Box
        sx={{ ...styles.rootBtns, ...styles.getRoot(hover) }}
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
        sx={{ ...styles.rootBtns, ...styles.getRoot(hover) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Box sx={styles.rowButtons}>
          {/*Animation Controls*/}
          <ButtonGroup
            sx={[styles.btnGroup, { display: timeLength === 0 ? 'none' : '' }]}
            aria-label="contained button group"
            variant="contained"
          >
            <TooltipButton
              title={`Reduce time by one ${timeUnits}`}
              placement="left-end"
              disabled={currentTime === 0}
              onClick={() => {
                const newTime = currentTime - 1
                if (newTime >= 0) {
                  dispatch(timeSelection(newTime))
                }
              }}
            >
              <MdNavigateBefore />
            </TooltipButton>
            {animation ? (
              <TooltipButton
                title="Pause animation"
                placement="top"
                onClick={() => {
                  clearInterval(animation)
                  setAnimation(false)
                }}
              >
                <MdPause />
              </TooltipButton>
            ) : (
              <TooltipButton
                title="Play animation"
                placement="top"
                onClick={() => {
                  const animationInterval = setInterval(advanceAnimation, 1000)
                  setAnimation(animationInterval)
                }}
              >
                <MdPlayArrow />
              </TooltipButton>
            )}
            <TooltipButton
              title={`Set current ${timeUnits}`}
              placement="top"
              onClick={() =>
                dispatch(openMapModal({ feature: 'setTime', mapId }))
              }
            >
              {currentTime + 1}
            </TooltipButton>
            <TooltipButton
              title={`Advance time by one ${timeUnits}`}
              placement="top"
              disabled={currentTime === timeLength - 1}
              onClick={advanceAnimation}
            >
              <MdNavigateNext />
            </TooltipButton>
          </ButtonGroup>
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
              <MdApps />
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
