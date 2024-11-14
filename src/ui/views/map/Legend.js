import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  FormControl,
  Grid2,
  IconButton,
  InputAdornment,
  InputLabel,
  Paper,
  Typography,
} from '@mui/material'
import { createContext, useCallback, useMemo } from 'react'
import { LuShapes } from 'react-icons/lu'
import { MdOutlineEdit, MdOutlineFactCheck } from 'react-icons/md'
import { RiSettings5Line } from 'react-icons/ri'
import { TbLogicAnd, TbMathFunction } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectBearingSliderToggleFunc,
  selectNodeRangeAtZoomFunc,
  selectPitchSliderToggleFunc,
  selectShowLegendGroupNamesFunc,
  selectSync,
} from '../../../data/selectors'
import { propId, statFuncs } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { getStatFuncsByType, getStatLabel } from '../../../utils/stats'

import { FetchedIcon, Select } from '../../compound'

import {
  colorToRgba,
  forceArray,
  includesPath,
  NumberFormat,
} from '../../../utils'

const styles = {
  root: {
    position: 'absolute',
    top: '8px',
    zIndex: 1,
    overflow: 'auto',
    scrollbarGutter: 'stable',
  },
  legendRoot: {
    width: 'auto',
    minWidth: '120px',
    maxWidth: '600px',
    p: (theme) => theme.spacing(0, 1, 1),
    mx: 0,
    color: 'text.primary',
    border: 2,
    borderColor: (theme) => theme.palette.grey[500],
    borderStyle: 'outset',
    borderRadius: 1,
  },
  getRippleBox: (selected) => ({
    border: `1px ${selected ? 'inset' : 'outset'} rgb(128, 128, 128)`,
    borderRadius: 1,
  }),
}

export const MapContainerContext = createContext(null)

export const useLegendDetails = ({
  mapId,
  legendGroupId,
  id,
  group,
  colorBy,
  sizeBy,
  heightBy,
  shapePathEnd,
  featureTypeProps,
  getRange,
}) => {
  const getRangeOnZoom = useSelector(selectNodeRangeAtZoomFunc)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const basePath = useMemo(
    () => ['maps', 'data', mapId, 'legendGroups', legendGroupId, 'data', id],
    [id, legendGroupId, mapId]
  )

  // Valid ranges for all features
  const colorRange = useMemo(
    () => getRange(id, colorBy, mapId, 'colorByOptions'),
    [colorBy, getRange, id, mapId]
  )
  const sizeRange = useMemo(
    () => getRange(id, sizeBy, mapId, 'sizeByOptions'),
    [sizeBy, getRange, id, mapId]
  )
  // Groupable nodes (only)
  const clusterRange = useMemo(() => {
    if (getRangeOnZoom == null) return {}
    return getRangeOnZoom(mapId)
  }, [getRangeOnZoom, mapId])
  // Geos (only)
  const heightRange = useMemo(
    () =>
      heightBy != null
        ? getRange(id, heightBy, mapId, 'heightByOptions')
        : null,
    [getRange, heightBy, id, mapId]
  )

  const handleSelectGroupCalc = useCallback(
    (pathEnd) => (value, event) => {
      const path = [...basePath, pathEnd]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      if (event != null) event.stopPropagation()
    },
    [basePath, dispatch, sync]
  )

  const handleSelectProp = useCallback(
    (pathEnd, groupCalcPathEnd, groupCalcValue) => (value, event) => {
      const path = [...basePath, pathEnd]
      const newPropType = featureTypeProps[value].type
      if (!statFuncs[newPropType].has(groupCalcValue)) {
        // If the selected aggregation function is not
        // valid for the new prop type, set a default
        const [defaultGroupCalc] = getStatFuncsByType(newPropType)
        handleSelectGroupCalc(groupCalcPathEnd)(defaultGroupCalc)
      }
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      event.stopPropagation()
    },
    [basePath, dispatch, featureTypeProps, handleSelectGroupCalc, sync]
  )

  const handleToggleGroup = useCallback(
    (event) => {
      const path = [...basePath, 'group']
      dispatch(
        mutateLocal({
          path,
          value: !group,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      event.stopPropagation()
    },
    [basePath, dispatch, group, sync]
  )

  const handleChangeColor = useCallback(
    (pathEnd) => (value) => {
      const path = [...basePath, 'colorByOptions', colorBy, pathEnd]
      dispatch(
        mutateLocal({
          path,
          value: colorToRgba(value),
          sync: !includesPath(Object.values(sync), path),
        })
      )
    },
    [basePath, colorBy, dispatch, sync]
  )

  const handleChangeSize = useCallback(
    (pathEnd) => (value) => {
      const path = [...basePath, 'sizeByOptions', sizeBy, pathEnd]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
    },
    [basePath, dispatch, sizeBy, sync]
  )

  const handleChangeShape = useMutateStateWithSync(
    (event, value) => ({ path: [...basePath, shapePathEnd], value }),
    [basePath, shapePathEnd]
  )

  return {
    basePath,
    colorRange,
    sizeRange,
    clusterRange,
    heightRange,
    handleSelectGroupCalc,
    handleSelectProp,
    handleToggleGroup,
    handleChangeColor,
    handleChangeSize,
    handleChangeShape,
  }
}

export const useLegend = (mapId) => {
  const [showSettings, handleToggleSettings] = useToggle(false)
  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )
  const handleToggleLegendGroupNames = useMutateStateWithSync(
    () => ({
      path: ['maps', 'data', mapId, 'showLegendGroupNames'],
      value: !showLegendGroupNames,
    }),
    [mapId, showLegendGroupNames]
  )
  return {
    showSettings,
    handleToggleSettings,
    showLegendGroupNames,
    handleToggleLegendGroupNames,
  }
}

const getNumLabel = (value, numberFormat) =>
  NumberFormat.format(value, {
    ...numberFormat,
    // Formatting hierarchy: `props.legend<key>` -> `settings.defaults.legend<key>` -> `props.<key>` -> `settings.defaults.<key>`
    ...{
      precision: numberFormat.legendPrecision || numberFormat.precision,
      notation: numberFormat.legendNotation || numberFormat.notation,
      notationDisplay:
        numberFormat.legendNotationDisplay || numberFormat.notationDisplay,
    },
  })

const getMinMaxLabel = (
  valueRange,
  numberFormatRaw,
  group,
  minMaxKey,
  legendMinMaxLabel
) => {
  // eslint-disable-next-line no-unused-vars
  const { unit, unitPlacement, ...numberFormat } = numberFormatRaw
  return group
    ? getNumLabel(valueRange[minMaxKey], numberFormat)
    : numberFormat[legendMinMaxLabel] ||
        getNumLabel(valueRange[minMaxKey], numberFormat)
}

export const getMinLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'min', 'legendMinLabel')

export const getMaxLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'max', 'legendMaxLabel')

// TODO: Move this to some `legendUtils.js` module
export const RippleBox = ({ selected, sx = [], ...props }) => (
  <ButtonBase
    // component="div"
    sx={[styles.getRippleBox(selected), ...forceArray(sx)]}
    {...props}
  />
)

// TODO: Move this to some `legendUtils.js` module
export const WithBadge = ({
  reactIcon: ReactIcon,
  color,
  showBadge,
  sx = [],
  size = 16,
  ...props
}) => (
  <Badge
    overlap="circular"
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    invisible={!showBadge}
    sx={[showBadge && { color }, ...forceArray(sx)]}
    badgeContent={
      <Avatar
        sx={{
          bgcolor: color,
          height: size,
          width: size,
          border: '2px solid #4a4a4a',
        }}
      >
        <ReactIcon size={size - 2} style={{ padding: 0 }} />
      </Avatar>
    }
    {...props}
  />
)

// TODO: Move this to some `legendUtils.js` module
export const WithEditBadge = ({ editing, ...props }) => (
  <WithBadge
    reactIcon={MdOutlineEdit}
    color="#ffa726"
    showBadge={editing}
    {...props}
  />
)

export const PropIcon = ({ icon, selected, onClick, ...props }) => (
  <RippleBox sx={{ p: 1, borderRadius: '50%' }} {...{ selected, onClick }}>
    <FetchedIcon iconName={icon} {...props} />
  </RippleBox>
)

export const GroupCalcSelector = ({ type, value, onSelect }) => {
  const IconClass =
    type === propId.TOGGLE
      ? TbLogicAnd
      : type === propId.NUMBER
        ? TbMathFunction
        : LuShapes
  return (
    <FormControl fullWidth>
      <InputLabel id="group-calc-fn-label">Group Aggreg. Func.</InputLabel>
      <Select
        id="group-calc-fn"
        labelId="group-calc-fn-label"
        label="Group Aggreg. Func."
        getLabel={getStatLabel}
        optionsList={getStatFuncsByType(type)}
        startAdornment={
          <InputAdornment position="start">
            <IconClass size={24} />
          </InputAdornment>
        }
        {...{ value, onSelect }}
      />
    </FormControl>
  )
}

export const LegendHeader = ({
  label = 'Legend',
  labelProps,
  iconProps,
  showSettings,
  onToggleSettings,
  sx = [],
}) => (
  <Grid2
    container
    spacing={1}
    sx={[{ alignItems: 'center', px: 0.8 }, ...forceArray(sx)]}
  >
    <Grid2 size="grow" sx={{ textAlign: 'start' }}>
      <Typography variant="h6" {...labelProps}>
        {label}
      </Typography>
    </Grid2>
    <Grid2 size="auto">
      <IconButton
        size="small"
        color="primary"
        onClick={onToggleSettings}
        {...iconProps}
      >
        {showSettings ? <MdOutlineFactCheck /> : <RiSettings5Line />}
      </IconButton>
    </Grid2>
  </Grid2>
)

export const LegendRoot = ({ mapId, ...props }) => {
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  return (
    <Box
      key="map-legend"
      sx={[
        styles.root,
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
      <Paper {...props} />
    </Box>
  )
}
