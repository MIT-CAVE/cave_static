/** @jsxImportSource @emotion/react */
import { ButtonGroup, IconButton, Slider, Tooltip } from '@mui/material'
import { makeStyles } from '@mui/styles'
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

import {
  bearingSliderToggle,
  bearingUpdate,
  pitchSliderToggle,
  pitchUpdate,
  viewportUpdate,
  setZoom,
} from '../../../data/local/map/mapControlSlice'
import { toggleMapLegend } from '../../../data/local/map/mapLegendSlice'
import { openMapModal } from '../../../data/local/map/mapModalSlice'
import { timeSelection, timeAdvance } from '../../../data/local/settingsSlice'
import {
  selectDefaultViewport,
  selectOptionalViewports,
  selectBearingSliderToggle,
  selectPitchSliderToggle,
  selectBearing,
  selectPitch,
  selectZoom,
  selectTime,
  selectTimeUnits,
  selectTimeLength,
  selectStaticMap,
  selectAppBarId,
} from '../../../data/selectors'
import {
  MAX_BEARING,
  MAX_PITCH,
  MIN_BEARING,
  MIN_PITCH,
} from '../../../utils/constants'

import { getSliderMarks, prettifyValue } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
  mapControls: {
    marginBottom: theme.spacing(1.5),
  },
  rowButtons: {
    display: 'flex',
    columnGap: theme.spacing(1.5),
    zIndex: 1,
  },
  tooltip: {
    maxWidth: 200,
    margin: theme.spacing(1),
    ...theme.typography.caption,
  },
}))

const localCss = {
  iconButton: {
    padding: 5,
    // borderRadius: 0,
    // height: 48,
    // maxHeight: 48,
    // minHeight: 48,
    // width: 50,
    // minWidth: 50,
    opacity: 1,
    borderRadius: 'inherit',
  },
  pitchSlider: {
    '.MuiSlider-thumb': {
      height: 20,
      width: 20,
      // backgroundColor: '#00f',
      border: '2px solid currentColor',
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    '.MuiSlider-track': {
      width: 3,
      borderRadius: '4px',
    },
    '.MuiSlider-rail': {
      width: 3,
      borderRadius: '4px',
    },
  },
  bearingSlider: {
    '.MuiSlider-thumb': {
      height: 20,
      width: 20,
      // backgroundColor: '#00f',
      border: '2px solid currentColor',
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    '.MuiSlider-rail': {
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
  mapStyles: "Map Style \u279C Choose from the map's Mapbox styles",
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
    classes={{ tooltip: useStyles().tooltip }}
    {...{ title, placement }}
    aria-label={ariaLabel || title}
  >
    <span>
      <IconButton
        css={localCss.iconButton}
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

const MapControls = () => {
  const [hover, setHover] = useState(false)
  const [animation, setAnimation] = useState(false)
  const activeAnimation = useRef()

  const bearing = useSelector(selectBearing)
  const pitch = useSelector(selectPitch)
  const zoom = useSelector(selectZoom)
  const defaultViewport = useSelector(selectDefaultViewport)
  const optionalViewports = useSelector(selectOptionalViewports)
  const showBearingSlider = useSelector(selectBearingSliderToggle)
  const showPitchSlider = useSelector(selectPitchSliderToggle)
  const currentTime = useSelector(selectTime)
  const timeUnits = useSelector(selectTimeUnits)
  const timeLength = useSelector(selectTimeLength)
  const isStatic = useSelector(selectStaticMap)
  const appBarId = useSelector(selectAppBarId)

  const classes = useStyles()
  const dispatch = useDispatch()

  const getDegreeFormat = (value) => `${prettifyValue(value)}º`

  const root = classes.root

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
    <div
      css={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        'button,.MuiSlider-root': {
          opacity: hover ? 1 : 0.8,
        },
        button: {
          width: '48px',
        },
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        css={{
          position: 'absolute',
          right: '6px',
          bottom: '24px',
          zIndex: 1,
          textAlign: 'right',
        }}
      >
        {showPitchSlider && (
          <div
            css={{
              position: 'relative',
              height: '100px',
              marginBottom: '16px',
              width: 'auto',
            }}
          >
            <Slider
              css={localCss.pitchSlider}
              min={MIN_PITCH}
              max={MAX_PITCH}
              orientation="vertical"
              value={pitch}
              valueLabelDisplay="auto"
              valueLabelFormat={getDegreeFormat}
              marks={getSliderMarks(MIN_PITCH, MAX_PITCH, 2, getDegreeFormat)}
              onChange={(event, value) => dispatch(pitchUpdate(value))}
            />
          </div>
        )}

        {/* Map controls */}
        {isStatic ? (
          []
        ) : (
          <ButtonGroup
            classes={{ root }}
            className={classes.mapControls}
            orientation="vertical"
            variant="contained"
            size="small"
          >
            <TooltipButton
              title={tooltipTitles.pitch}
              onClick={() => dispatch(pitchSliderToggle())}
            >
              <MdHeight />
            </TooltipButton>
            <TooltipButton
              title={tooltipTitles.zoomIn}
              onClick={() => dispatch(setZoom(zoom + 0.5))}
            >
              <MdAdd />
            </TooltipButton>
            <TooltipButton
              title={tooltipTitles.zoomOut}
              onClick={() => dispatch(setZoom(zoom - 0.5))}
            >
              <MdRemove />
            </TooltipButton>
            <TooltipButton
              title={tooltipTitles.bearing}
              onClick={() => dispatch(bearingSliderToggle())}
            >
              <Md360 />
            </TooltipButton>
          </ButtonGroup>
        )}

        <div className={classes.rowButtons}>
          {/*Animation Controls*/}
          <ButtonGroup
            classes={{ root }}
            css={{ display: timeLength === 0 ? 'none' : '' }}
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
                title={'Pause animation'}
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
                title={'Play animation'}
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
                dispatch(openMapModal({ data: { feature: 'setTime' } }))
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
            classes={{ root }}
            aria-label="contained button group"
            variant="contained"
          >
            <TooltipButton
              title={tooltipTitles.mapLegend}
              placement="top"
              onClick={() => dispatch(toggleMapLegend())}
            >
              <MdApps />
            </TooltipButton>
          </ButtonGroup>

          {/* Map styles */}
          <ButtonGroup
            classes={{ root }}
            aria-label="contained button group"
            variant="contained"
          >
            <TooltipButton
              title={tooltipTitles.mapStyles}
              placement="top"
              onClick={() =>
                dispatch(openMapModal({ data: { feature: 'mapStyles' } }))
              }
            >
              <MdMap />
            </TooltipButton>
          </ButtonGroup>

          {/* Map viewports */}
          <ButtonGroup classes={{ root }} variant="contained">
            {!R.anyPass([R.isEmpty, R.isNil])(optionalViewports) && (
              <TooltipButton
                title={tooltipTitles.customViewports}
                placement="top"
                onClick={() =>
                  dispatch(openMapModal({ data: { feature: 'viewports' } }))
                }
              >
                <MdGpsFixed />
              </TooltipButton>
            )}
            <TooltipButton
              title={tooltipTitles.defaultViewport}
              placement="bottom-start"
              onClick={() => {
                dispatch(
                  viewportUpdate({ viewport: defaultViewport, appBarId })
                )
              }}
            >
              <MdHome />
            </TooltipButton>
          </ButtonGroup>
        </div>
      </div>

      {showBearingSlider && (
        <div
          css={{
            position: 'absolute',
            right: '84px',
            bottom: '64px',
            width: '150px',
            zIndex: 1,
          }}
        >
          <Slider
            css={localCss.bearingSlider}
            min={MIN_BEARING}
            max={MAX_BEARING}
            value={bearing}
            track={false}
            valueLabelDisplay="auto"
            valueLabelFormat={getDegreeFormat}
            marks={getSliderMarks(MIN_BEARING, MAX_BEARING, 5, getDegreeFormat)}
            onChange={(event, value) => dispatch(bearingUpdate(value))}
          />
        </div>
      )}
    </div>
  )
}

export default memo(MapControls)
