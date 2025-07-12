import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonBase,
  ClickAwayListener,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  InputLabel,
  Paper,
  Popper,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { useCallback, useContext, useMemo, useState } from 'react'
import { LuShapes } from 'react-icons/lu'
import { MdOutlineEdit } from 'react-icons/md'
import { PiColumns, PiLayout, PiRows } from 'react-icons/pi'
import { RiSettings5Line } from 'react-icons/ri'
import {
  TbArrowAutofitWidth,
  TbViewportWide,
  TbViewportNarrow,
  TbLogicAnd,
  TbMathFunction,
} from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'

import MapPortal from './MapPortal'
import useMapApi, { MapContext } from './useMapApi'

import { mutateLocal } from '../../../data/local'
import {
  selectArcRange,
  selectBearingSliderToggleFunc,
  selectEffectiveArcsBy,
  selectEffectiveGeosBy,
  selectEffectiveNodesBy,
  selectGeoRange,
  selectLegendLayout,
  selectLegendNumberFormatFunc,
  selectLegendView,
  selectLegendWidth,
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectPitchSliderToggleFunc,
  selectSettingsIconUrl,
  selectShowLegendGroupNames,
  selectShowLegendAdvancedControls,
  selectSync,
  selectZoomFunc,
} from '../../../data/selectors'
import { MAX_ZOOM, MIN_ZOOM } from '../../../utils/constants'
import {
  legendLayouts,
  legendViews,
  legendWidths,
  propId,
  scaleId,
  scaleParamsById,
  statFuncs,
} from '../../../utils/enums'
import { useMenu, useMutateStateWithSync } from '../../../utils/hooks'
import {
  getScaledValueAlt,
  getScaleParamDefaults,
  getScaleParamLabel,
  scaleIndexedOptions,
} from '../../../utils/scales'
import { getStatFuncsByType, getStatLabel } from '../../../utils/stats'
import { EnhancedListbox, useIconDataLoader } from '../../compound/ShapePicker'

import { FetchedIcon, NumberInput, Select } from '../../compound'

import {
  forceArray,
  getChartItemColor,
  getColorString,
  includesPath,
  NumberFormat,
  parseGradient,
} from '../../../utils'

const styles = {
  root: {
    position: 'absolute',
    top: '8px',
    zIndex: 1,
    overflow: 'auto',
    scrollbarGutter: 'stable',
  },
  details: {
    maxHeight: '100%',
    maxWidth: '100%',
    bgcolor: 'grey.800',
    p: 1,
    border: '1px outset rgb(128 128 128)',
    boxSizing: 'border-box',
  },
  settings: {
    overflow: 'auto',
    maxWidth: 'fit-content',
    borderWidth: 2,
    pt: 2,
  },
  toggleGroup: {
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      m: 0.5,
      border: '1px outset rgb(128 128 128)',
      borderRadius: 0,
    },
    [`& .${toggleButtonGroupClasses.selected}`]: {
      m: 0.5,
      borderStyle: 'inset',
      borderRadius: 0,
    },
  },
  toggleButton: {
    p: 1,
    borderRadius: '50%',
  },
  popper: {
    height: '100%',
    overflow: 'hidden',
    zIndex: 2,
  },
  getRippleBox: (selected) => ({
    border: `1px ${selected ? 'inset' : 'outset'} rgb(128 128 128)`,
    borderRadius: 1,
  }),
}

export const useLegendDetails = ({
  legendGroupId,
  id,
  group,
  colorBy,
  sizeBy,
  heightBy,
  shapePathEnd,
  featureTypeProps,
  featureTypeValues,
  getRange,
}) => {
  const { mapId } = useContext(MapContext)
  const getRangeOnZoom = useSelector(selectNodeRangeAtZoomFunc)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  // Valid ranges for all features
  const colorRange = useMemo(
    () => getRange(id, colorBy, mapId),
    [colorBy, getRange, id, mapId]
  )
  const sizeRange = useMemo(
    () => getRange(id, sizeBy, mapId),
    [sizeBy, getRange, id, mapId]
  )
  // Groupable nodes (only)
  const clusterRange = useMemo(
    () => (getRangeOnZoom != null ? (getRangeOnZoom(mapId)[id] ?? {}) : {}),
    [getRangeOnZoom, id, mapId]
  )
  // Geos (only)
  const heightRange = useMemo(
    () => (heightBy != null ? getRange(id, heightBy, mapId) : null),
    [getRange, heightBy, id, mapId]
  )

  const hasAnyNullValue = useCallback(
    (propId) =>
      !group && R.pipe(R.pluck(propId), R.any(R.isNil))(featureTypeValues),
    [featureTypeValues, group]
  )

  const basePath = useMemo(
    () => ['maps', 'data', mapId, 'legendGroups', legendGroupId, 'data', id],
    [id, legendGroupId, mapId]
  )
  const handleChangeLegendAttr = useCallback(
    (pathTail) => (value, event) => {
      const path = [...basePath, ...forceArray(pathTail)]
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
  const handleToggleGroup = useMutateStateWithSync(
    (event, value) => {
      event.stopPropagation()
      return { path: [...basePath, 'group'], value: !value }
    },
    [basePath]
  )
  const handleChangeShape = useMutateStateWithSync(
    (event, value) => ({ path: [...basePath, shapePathEnd], value }),
    [basePath, shapePathEnd]
  )
  const handleSelectProp = useCallback(
    (pathTail, groupCalcPathTail, groupCalcValue) => (value, event) => {
      const path = [...basePath, pathTail]
      const newPropType = featureTypeProps[value].type
      if (!statFuncs[newPropType].has(groupCalcValue)) {
        // If the selected aggregation function is not
        // valid for the new prop type, set a default
        const [defaultGroupCalc] = getStatFuncsByType(newPropType)
        handleChangeLegendAttr(groupCalcPathTail)(defaultGroupCalc)
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
    [basePath, dispatch, featureTypeProps, handleChangeLegendAttr, sync]
  )

  const basePathProp = useMemo(() => ['mapFeatures', 'data', id, 'props'], [id])
  const handleChangePropAttr = useCallback(
    (pathTail) => (value) => {
      const path = [...basePathProp, ...forceArray(pathTail)]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      // TODO: if (event != null) event.stopPropagation()
    },
    [basePathProp, dispatch, sync]
  )

  const handleChangeColor = useCallback(
    (pathTail) => (value) => {
      const newColor = getColorString(value)
      handleChangePropAttr([colorBy, ...forceArray(pathTail)])(newColor)
    },
    [colorBy, handleChangePropAttr]
  )
  const handleChangeSize = useCallback(
    (pathTail) => (value) => {
      handleChangePropAttr([sizeBy, ...forceArray(pathTail)])(value)
    },
    [sizeBy, handleChangePropAttr]
  )

  return {
    basePath,
    colorRange,
    sizeRange,
    clusterRange,
    heightRange,
    hasAnyNullValue,
    handleChangeLegendAttr,
    handleSelectProp,
    handleToggleGroup,
    handleChangeColor,
    handleChangeSize,
    handleChangeShape,
    handleChangePropAttr,
  }
}

export const useLegendPopper = () => {
  const [openId, setOpenId] = useState()

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const handleClose = useCallback(
    (event) => {
      setOpenId(null)
      handleCloseMenu(event)
    },
    [handleCloseMenu]
  )

  const handleOpenById = useCallback(
    (id) => (event) => {
      setOpenId(id)
      handleOpenMenu(event)
    },
    [handleOpenMenu]
  )

  return {
    openId,
    anchorEl,
    handleClose,
    handleOpenById,
  }
}

export const useGradient = ({
  labels,
  values,
  rawValues,
  dataIndices,
  gradient,
  numberFormat: numberFormatRaw,
  group,
  onChangeValueAt,
}) => {
  const lastIndex = values.length - 1
  const isStepScale = gradient.scale === scaleId.STEP
  const minAuto = gradient.data[dataIndices[0]].value === 'min'
  const maxAuto = gradient.data[dataIndices[lastIndex]].value === 'max'

  const numberFormat = useMemo(
    () => R.omit(['unit', 'unitPlacement'])(numberFormatRaw),
    [numberFormatRaw]
  )

  const getFormattedValueAt = useCallback(
    (index) => NumberFormat.format(values[index], numberFormat),
    [numberFormat, values]
  )

  const getLabel = useCallback(
    (index) => {
      const isLabelEmpty = labels[index] == null || labels[index] === ''
      return group || isLabelEmpty || values[index] !== rawValues[index]
        ? getFormattedValueAt(index)
        : labels[index]
    },
    [getFormattedValueAt, group, labels, rawValues, values]
  )

  const getAttrLabelAt = useCallback(
    (index) => {
      const isLabelEmpty = labels[index] == null || labels[index] === ''
      return index > 0 && index < lastIndex // Within the bounds
        ? isStepScale
          ? `[${getFormattedValueAt(index - 1)}, ${getFormattedValueAt(index)})${isLabelEmpty ? '' : ` "${getLabel(index)}"`}`
          : `"${getLabel(index)}"`
        : isStepScale
          ? `${index < 1 ? `(-\u221E, ${getFormattedValueAt(index)})` : `[${getFormattedValueAt(index - 1)}, \u221E)`}`
          : `${index < 1 ? 'Min' : 'Max'}`
    },
    [getFormattedValueAt, getLabel, isStepScale, labels, lastIndex]
  )

  const getValueLabelAt = useCallback(
    (index) => {
      const label = getLabel(index)
      const isLabelEmpty = labels[index] == null || labels[index] === ''
      const isValueAdjusted = values[index] !== rawValues[index]
      return index > 0 && index < lastIndex // Within the bounds
        ? isStepScale
          ? `Threshold \u279D [${getFormattedValueAt(index - 1)}, \u2B07)${isLabelEmpty ? '' : ` "${label}"`}`
          : `Value${
              isValueAdjusted
                ? ` \u279D Adjusted to ${label}`
                : isLabelEmpty
                  ? ''
                  : ` \u279D "${label}"`
            }`
        : isStepScale
          ? index < 1
            ? `Threshold \u279D (-\u221E, ${getFormattedValueAt(index)})`
            : null // This should not happen as the max value for a step function is not displayed
          : `Value \u279D ${
              isValueAdjusted
                ? `Adjusted to ${label}`
                : index < 1
                  ? minAuto
                    ? 'Min (Auto)'
                    : 'Min'
                  : maxAuto
                    ? 'Max (Auto)'
                    : 'Max'
            }`
    },
    [
      getFormattedValueAt,
      getLabel,
      isStepScale,
      labels,
      lastIndex,
      maxAuto,
      minAuto,
      rawValues,
      values,
    ]
  )

  const getAdjustedLabel = useCallback(
    (label, index) =>
      values[index] === rawValues[index] ? label : `${label} (Adjusted)`,
    [rawValues, values]
  )

  const handleSetAutoValueAt = useCallback(
    (dataIndex, index) => () =>
      onChangeValueAt(dataIndex)(index < 1 ? 'min' : 'max'),
    [onChangeValueAt]
  )

  const handleSwapColorsAt = useCallback(
    (index) => (event) => {
      // TODO
      console.log(index, { event })
    },
    []
  )

  return {
    isStepScale,
    lastIndex,
    minAuto,
    maxAuto,
    getLabel,
    getAdjustedLabel,
    getAttrLabelAt,
    getValueLabelAt,
    getFormattedValueAt,
    handleSetAutoValueAt,
    handleSwapColorsAt,
  }
}

const GradientColorMarker = ({ id, group, colorBy, colorByProp, getRange }) => {
  const { mapId } = useContext(MapContext)
  const getRangeOnZoom = useSelector(selectNodeRangeAtZoomFunc)
  const legendNumberFormatFunc = useSelector(selectLegendNumberFormatFunc)

  const valueRange = useMemo(() => {
    const colorRange = getRange(id, colorBy, mapId)
    // Groupable nodes (only)
    const clusterRange =
      getRangeOnZoom != null ? (getRangeOnZoom(mapId)[id] ?? {}) : {}
    return group && clusterRange.color
      ? R.mergeDeepLeft(clusterRange.color, colorRange)
      : colorRange
  }, [colorBy, getRange, getRangeOnZoom, group, id, mapId])

  const { colors, values } = useMemo(() => {
    const numberFormat = legendNumberFormatFunc(colorByProp)
    return parseGradient('color', numberFormat.precision)(valueRange)
  }, [colorByProp, legendNumberFormatFunc, valueRange])

  const gradientColors = useMemo(() => {
    const { scale, scaleParams } = valueRange.gradient
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const lastIndex = values.length - 1
    const isStepScale = scale === scaleId.STEP

    const scaledValues = R.map((value) =>
      getScaledValueAlt(
        [minValue, maxValue],
        [0, 100],
        value,
        isStepScale ? scaleId.LINEAR : scale,
        scaleParams
      )
    )(values)

    const scaledColors =
      minValue === maxValue
        ? isStepScale
          ? [`${colors[0]} 1%`, `${colors[lastIndex]} 1% 100%`]
          : [`${colors[lastIndex]} 0% 100%`]
        : R.addIndex(R.zipWith)(
            (color, scaledValue, idx) =>
              !isStepScale
                ? `${color} ${scaledValue}%`
                : idx > 0
                  ? `${color} ${scaledValues[idx - 1]}% ${scaledValue}%`
                  : `${color} 1%`,
            colors
          )(scaledValues)

    return scaledColors.filter((value) => value != null)
  }, [colors, valueRange, values])

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        background: `linear-gradient(to right, ${gradientColors.join(', ')})`,
        border: '1px outset rgb(128 128 128)',
        borderRadius: 1,
      }}
    />
  )
}

const CategoricalColorMarker = ({ colorByProp, anyNullValue }) => {
  const { options, fallback } = colorByProp

  const displayedColors = useMemo(() => {
    const maxVisible = 9 // Max number of color markers
    return R.pipe(
      R.map((d) => R.propOr(getChartItemColor(d.name), 'color')(d)),
      R.values,
      R.when(
        R.always(anyNullValue && fallback?.color != null),
        R.append(fallback?.color)
      ),
      R.slice(0, maxVisible)
    )(options)
  }, [anyNullValue, fallback?.color, options])

  const width = 28
  const height = 20
  const gap = 2
  const numColors = displayedColors.length

  // Compute grid (max 3 columns)
  const cols = numColors <= 4 ? 2 : 3
  const rows = Math.ceil(numColors / cols)
  const markerWidth = (width - gap * (cols - 1)) / cols
  const markerHeight = (height - gap * (rows - 1)) / rows
  // const rx = Math.min(markerWidth, markerHeight) * 0.4 // rounded corners

  return (
    <svg {...{ height, width }}>
      <defs>
        <linearGradient id="outsetBorder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>
      {displayedColors.map((color, idx) => {
        const row = Math.floor(idx / cols)
        const col = idx % cols
        const x = col * (markerWidth + gap)
        const y = row * (markerHeight + gap)
        return (
          <rect
            key={idx}
            {...{
              x,
              y,
              // rx
            }}
            width={markerWidth}
            height={markerHeight}
            fill={color}
            stroke="url(#outsetBorder)"
            strokeWidth="0.5"
            style={{
              filter: 'drop-shadow(0 1px 1px rgba(0 0 0 / .18))',
              transition: 'fill 0.2s',
            }}
          />
        )
      })}
    </svg>
  )
}

export const LegendColorMarker = ({
  id,
  group,
  colorBy,
  colorByProp,
  anyNullValue,
  getRange,
}) => {
  const isCategorical = colorByProp.type !== propId.NUMBER
  return (
    <Box sx={{ height: '20px', width: '28px' }}>
      {isCategorical ? (
        <CategoricalColorMarker {...{ colorByProp, anyNullValue }} />
      ) : (
        <GradientColorMarker
          {...{
            id,
            group,
            colorBy,
            colorByProp,
            getRange,
          }}
        />
      )}
    </Box>
  )
}

// TODO: Move this to some `legendUtils.js` module
// eslint-disable-next-line no-unused-vars
const FormToggle = ({ id, value, label, icon: Icon, selected }) => (
  <FormControlLabel
    value={`${id}-${value}`}
    control={
      <ToggleButton {...{ value, selected }} sx={{ mb: 1 }}>
        <Icon size={24} />
      </ToggleButton>
    }
    {...{ label }}
    labelPlacement="bottom"
  />
)

// TODO: Move this to some `legendUtils.js` module
const FormSwitch = ({
  disabled,
  value,
  checked,
  label,
  slotProps,
  onChange,
  ...props
}) => (
  <FormControlLabel
    {...{ disabled, value, label, ...props }}
    control={
      <Switch
        name={`cave-${value}`}
        {...{ checked, onChange, ...slotProps?.switch }}
      />
    }
    labelPlacement="end"
  />
)

// TODO: Move this to some `legendUtils.js` module
export const RippleBox = ({ selected, sx = [], ...props }) => (
  <ButtonBase
    component="div"
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
      showBadge && (
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
      )
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

// TODO: Move this to some `legendUtils.js` module
export const PropIcon = ({ icon, selected, onClick, ...props }) => (
  <RippleBox sx={{ p: 1, borderRadius: '50%' }} {...{ selected, onClick }}>
    <FetchedIcon iconName={icon} {...props} />
  </RippleBox>
)

export const ScaleSelector = ({
  scale = scaleId.LINEAR,
  minDomainValue,
  scaleParams,
  onSelect,
  onChangeScaleParamById,
}) => {
  const validScales = useMemo(
    () =>
      R.pipe(
        R.values,
        R.when(R.always(minDomainValue <= 0), R.without([scaleId.LOG]))
      )(scaleId),
    [minDomainValue]
  )
  const scaleParamId = scaleParamsById[scale]
  return (
    <Stack direction="row" spacing={1}>
      <FormControl fullWidth>
        <InputLabel id="scale-fn-label">Gradient Scale Func.</InputLabel>
        <Select
          id="scale-fn"
          labelId="scale-fn-label"
          label="Gradient Scale Func."
          optionsList={validScales}
          startAdornment={
            <InputAdornment position="start">
              <FetchedIcon
                iconName={scaleIndexedOptions[scale]?.iconName}
                size={24}
              />
            </InputAdornment>
          }
          value={scale}
          getLabel={(option) => scaleIndexedOptions[option]?.label}
          {...{ onSelect }}
        />
      </FormControl>
      {scale === scaleId.POW && (
        <NumberInput
          sx={{ width: '100%' }}
          label={getScaleParamLabel(scaleParamId)}
          numberFormat={{}}
          value={R.propOr(
            getScaleParamDefaults(scaleParamId),
            scaleParamId
          )(scaleParams)}
          slotProps={{ input: { sx: { borderRadius: 0 } } }}
          onClickAway={onChangeScaleParamById(scaleParamId)}
        />
      )}
    </Stack>
  )
}

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

export const GroupScaleControls = ({
  groupScaleWithZoom,
  sizeSliderProps,
  handleChange,
  handleChangeComitted,
  onChangeLegendAttr,
}) => {
  const { mapId } = useContext(MapContext)
  const zoom = useSelector(selectZoomFunc)(mapId)
  const [sliderValue] = sizeSliderProps.value
  const [minZoom, maxZoom] = useMemo(
    () => [Math.floor(MIN_ZOOM), Math.floor(MAX_ZOOM)],
    []
  )
  const handleToggleGroupScaleWithZoom = useCallback(
    (event, value) => {
      onChangeLegendAttr('groupScaleWithZoom')(value)
    },
    [onChangeLegendAttr]
  )
  const marks = useMemo(
    () => [
      ...(sliderValue - 2 > minZoom ? [{ value: minZoom, label: 'Min' }] : []),
      { value: sliderValue, label: 'Start at' },
      ...(sliderValue + 2 < maxZoom ? [{ value: maxZoom, label: 'Max' }] : []),
    ],
    [maxZoom, minZoom, sliderValue]
  )
  return (
    <Stack
      spacing={2}
      useFlexGap
      sx={{
        py: 2,
        m: 1,
        border: '2px solid #ffa726',
        borderRadius: 1,
        boxSizing: 'border-box',
      }}
    >
      <FormSwitch
        label="Group with no zoom restrictions"
        value="toggle-group-with-no-zoom-restrictions"
        slotProps={{
          switch: {
            color: 'warning',
            size: 'small',
            sx: { ml: 3 },
          },
        }}
        checked={groupScaleWithZoom}
        onChange={handleToggleGroupScaleWithZoom}
      />
      <Slider
        disabled={groupScaleWithZoom}
        sx={{
          mt: 3,
          width: '85%',
          alignSelf: 'center',
          boxSizing: 'border-box',
        }}
        min={minZoom}
        max={maxZoom}
        {...{ marks }}
        color="warning"
        value={sizeSliderProps.value}
        onChange={handleChange}
        onChangeCommitted={handleChangeComitted}
        valueLabelDisplay={groupScaleWithZoom ? 'off' : 'on'}
        // valueLabelFormat={(value) => `${value}x`}
      />
      <Typography
        color={groupScaleWithZoom ? 'text.secondary' : 'text.primary'}
        variant="body1"
      >
        {'Current zoom level: '}
        <span style={{ fontWeight: 'bold' }}>
          {NumberFormat.format(zoom, { precision: 2 })}
        </span>
      </Typography>
    </Stack>
  )
}

export const LegendPopper = ({
  IconComponent,
  children,
  slotProps = {},
  anchorEl,
  onClose,
  ...props
}) => {
  const { mapId } = useContext(MapContext)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)

  const open = Boolean(anchorEl)
  const {
    badge: { showBadge, reactIcon, ...muiBadgeProps } = {},
    ...muiSlotProps
  } = slotProps

  return (
    <Box sx={{ p: 0.25, ml: 1, borderRadius: 1 }} {...props}>
      <WithBadge
        size={14}
        color="#29b6f6"
        {...{ showBadge, reactIcon }}
        slotProps={{
          badge: {
            ...muiBadgeProps,
            sx: [{ right: 0, top: 0 }, ...forceArray(muiBadgeProps?.sx)],
          },
        }}
      >
        <IconComponent
          color={open ? '#90caf9' : '#fff'}
          {...muiSlotProps.icon}
        />
      </WithBadge>
      {/* Use `MapPortal` wrapper to prevent `Popper` to overflow the map chart */}
      <MapPortal>
        <ClickAwayListener
          onClickAway={(event) => {
            // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
            if (sessionStorage.getItem('mui-select-open-flag') === '1') return
            onClose(event)
          }}
        >
          <Popper
            disablePortal
            placement="left"
            {...{ open, anchorEl, onClose, ...muiSlotProps.popper }}
            onClick={(event) => {
              event.stopPropagation()
            }}
            sx={[
              styles.popper,
              {
                maxHeight: showBearingSlider
                  ? 'calc(100% - 165px)'
                  : 'calc(100% - 88px)',
                maxWidth: showPitchSlider
                  ? 'calc(100% - 334px)'
                  : 'calc(100% - 300px)',
              },
              ...forceArray(muiSlotProps.popper?.sx),
            ]}
          >
            {children}
          </Popper>
        </ClickAwayListener>
      </MapPortal>
    </Box>
  )
}

export const LegendRowNode = ({ LegendRowComponent, ...props }) => {
  const [options, setOptions] = useState([])
  const effectiveNodesBy = useSelector(selectEffectiveNodesBy)
  const getRange = useSelector(selectNodeRange)
  const iconUrl = useSelector(selectSettingsIconUrl)
  useIconDataLoader(iconUrl, setOptions, console.error)
  return (
    <LegendRowComponent
      mapFeaturesBy={effectiveNodesBy}
      shapeOptions={options}
      shapePathEnd="icon"
      shape={props.icon}
      shapeLabel="Search available icons"
      getShapeIcon={(option) => option}
      getShapeLabel={(option) => option?.split('/')[1]}
      ListboxComponent={EnhancedListbox}
      // TODO: Implement groups
      // groupBy={(option) => option?.split('/')[0]}
      {...{ getRange, ...props }}
    />
  )
}

export const LegendRowArc = ({ LegendRowComponent, ...props }) => {
  const { mapId } = useContext(MapContext)
  const { isMapboxSelected } = useMapApi(mapId)
  const effectiveArcsBy = useSelector(selectEffectiveArcsBy)
  const getRange = useSelector(selectArcRange)
  const disabled = !isMapboxSelected
  const indexedOptions = useMemo(
    () => ({
      solid: { icon: 'ai/AiOutlineLine', label: 'Solid' },
      dotted: { icon: 'ai/AiOutlineEllipsis', label: 'Dotted', disabled },
      dashed: { icon: 'ai/AiOutlineDash', label: 'Dashed', disabled },
      '3d': { icon: 'vsc/VscLoading', label: 'Arc', disabled: true }, // Always disabled for now
    }),
    [disabled]
  )
  const shapeOptions = useMemo(
    () => Object.keys(indexedOptions),
    [indexedOptions]
  )
  const currentLineStyle = isMapboxSelected
    ? (props.lineStyle ?? 'solid')
    : 'solid'
  return (
    <LegendRowComponent
      mapFeaturesBy={effectiveArcsBy}
      shapePathEnd="lineStyle"
      shape={currentLineStyle}
      icon={indexedOptions[currentLineStyle]?.icon}
      shapeLabel="Select the line style"
      {...{ shapeOptions, getRange, ...props }}
      shapeWarning={
        !isMapboxSelected &&
        "Only the 'solid' line style is supported when using MapLibre. Other styles ('dotted', 'dashed', etc.) will be displayed as solid lines."
      }
      getShapeIcon={(option) => indexedOptions[option]?.icon}
      getShapeLabel={(option) => indexedOptions[option]?.label}
      getShapeDisabled={(option) => indexedOptions[option]?.disabled}
    />
  )
}

export const LegendRowGeo = ({ LegendRowComponent, ...props }) => {
  const effectiveGeosBy = useSelector(selectEffectiveGeosBy)
  const getRange = useSelector(selectGeoRange)
  return (
    <LegendRowComponent
      mapFeaturesBy={effectiveGeosBy}
      {...{ getRange, ...props }}
    />
  )
}

// This is a reserved ID and shouldn't be used by API designers for map feature IDs in the legend
const LEGEND_SETTINGS_POPPER_ID = 'legend-settings-popper'

const SettingsToggle = ({ value, label, icon: Icon, selected }) => (
  <ToggleButton {...{ value, selected }}>
    <Icon size={24} style={{ marginRight: '8px' }} />
    {label}
  </ToggleButton>
)

export const LegendSettings = ({ expandAll, onExpandAll }) => {
  const { mapId } = useContext(MapContext)
  const legendView = useSelector(selectLegendView)[mapId]
  const showLegendAdvancedControls = useSelector(
    selectShowLegendAdvancedControls
  )[mapId]
  const showLegendGroupNames = useSelector(selectShowLegendGroupNames)[mapId]
  const legendLayout = useSelector(selectLegendLayout)[mapId]
  const legendWidth = useSelector(selectLegendWidth)[mapId]

  const handleChangeView = useMutateStateWithSync(() => {
    // Toggle between `full` and `compact` legend views,
    // as these are the only available options for now.
    const newLegendView =
      legendView === legendViews.FULL ? legendViews.COMPACT : legendViews.FULL
    return {
      path: ['maps', 'data', mapId, 'legendView'],
      value: newLegendView,
    }
  }, [mapId, legendView])

  const handleToggleLegendGroupNames = useMutateStateWithSync(
    (event, value) => ({
      path: ['maps', 'data', mapId, 'showLegendGroupNames'],
      value,
    }),
    [mapId]
  )

  const handleChangeLegendLayout = useMutateStateWithSync(
    (event, value) => ({
      path: ['maps', 'data', mapId, 'legendLayout'],
      value,
    }),
    [mapId]
  )

  const handleChangeLegendWidth = useMutateStateWithSync(
    (event, value) => ({
      path: ['maps', 'data', mapId, 'legendWidth'],
      value,
    }),
    [mapId]
  )

  const handleToggleAdvancedControls = useMutateStateWithSync(
    (event, value) => ({
      path: ['maps', 'data', mapId, 'showLegendAdvancedControls'],
      value,
    }),
    [mapId]
  )

  const isFullView = legendView === legendViews.FULL
  return (
    <Stack
      component={Paper}
      elevation={1}
      spacing={1}
      divider={<Divider />}
      sx={[styles.details, styles.settings]}
    >
      <Typography variant="h5" sx={{ textAlign: 'start' }}>
        Settings
      </Typography>

      <FormGroup>
        {isFullView && (
          <FormSwitch
            value="expand-or-collapse-legend"
            label="Expand all"
            checked={expandAll}
            onChange={onExpandAll}
          />
        )}
        <FormSwitch
          value="toggle-legend-group-names"
          label="Show legend group names"
          checked={showLegendGroupNames}
          onChange={handleToggleLegendGroupNames}
        />
        <FormSwitch
          value="toggle-advanced-controls"
          label="Show advanced controls"
          checked={showLegendAdvancedControls}
          onChange={handleToggleAdvancedControls}
        />
      </FormGroup>

      <Stack>
        <Typography variant="subtitle2" sx={{ textAlign: 'start', pl: 0.5 }}>
          Layout width
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          color="primary"
          sx={styles.toggleGroup}
          value={legendWidth}
          onChange={handleChangeLegendWidth}
        >
          <SettingsToggle
            value={legendWidths.AUTO}
            icon={TbArrowAutofitWidth}
            label="Auto"
          />
          <SettingsToggle
            value={legendWidths.SLIM}
            icon={TbViewportNarrow}
            label="Slim"
            selected={
              (!isFullView && legendWidth === legendWidths.AUTO) ||
              legendWidth === legendWidths.SLIM
            }
          />
          <SettingsToggle
            value={legendWidths.WIDE}
            icon={TbViewportWide}
            label="Wide"
            selected={
              (isFullView && legendWidth === legendWidths.AUTO) ||
              legendWidth === legendWidths.WIDE
            }
          />
        </ToggleButtonGroup>
      </Stack>

      <Stack>
        <Typography variant="subtitle2" sx={{ textAlign: 'start', pl: 0.5 }}>
          Placement
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          color="primary"
          sx={styles.toggleGroup}
          value={legendLayout}
          onChange={handleChangeLegendLayout}
        >
          <SettingsToggle
            value={legendLayouts.AUTO}
            icon={PiLayout}
            label="Auto"
          />
          <SettingsToggle
            value={legendLayouts.ROW}
            icon={PiRows}
            label="Rows"
            selected={
              (!isFullView && legendLayout === legendLayouts.AUTO) ||
              legendLayout === legendLayouts.ROW
            }
          />
          <SettingsToggle
            value={legendLayouts.COLUMN}
            icon={PiColumns}
            label="Cols"
            selected={
              (isFullView && legendLayout === legendLayouts.AUTO) ||
              legendLayout === legendLayouts.COLUMN
            }
          />
        </ToggleButtonGroup>
      </Stack>

      <Button variant="contained" color="warning" onClick={handleChangeView}>
        {`Switch to ${isFullView ? 'Compact' : 'Full'} View`}
      </Button>
    </Stack>
  )
}

export const LegendHeader = ({
  label = 'Legend',
  slotProps = {},
  sx = [],
  popperProps,
  children,
}) => {
  const { openId, handleOpenById, handleClose } = popperProps
  const anchorEl =
    openId === LEGEND_SETTINGS_POPPER_ID || openId == null
      ? popperProps.anchorEl
      : null
  const handleOpen = handleOpenById(LEGEND_SETTINGS_POPPER_ID)
  return (
    <ToggleButton
      fullWidth
      size="small"
      color="primary"
      value="details"
      selected={Boolean(anchorEl)}
      sx={{
        p: 0,
        textTransform: 'initial',
        border: 'none',
        borderRadius: 0,
      }}
      // Toggle when clicking on the opened popper
      onClick={anchorEl == null ? handleOpen : handleClose}
    >
      <Grid
        container
        spacing={1}
        sx={[
          { alignItems: 'center', px: 0.8, my: 1, width: '100%' },
          ...forceArray(sx),
        ]}
      >
        <Grid size="grow" sx={{ textAlign: 'start' }}>
          <Typography variant="h6" {...slotProps.label}>
            {label}
          </Typography>
        </Grid>
        <Grid size="auto">
          <LegendPopper
            sx={styles.toggleButton}
            IconComponent={RiSettings5Line}
            {...{ anchorEl, slotProps }}
            onClose={handleClose}
          >
            {children}
          </LegendPopper>
        </Grid>
      </Grid>
    </ToggleButton>
  )
}

export const LegendRoot = (props) => {
  const { mapId } = useContext(MapContext)
  const { isMapboxSelected } = useMapApi(mapId)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
  const attributionOffset = isMapboxSelected ? 0 : 16
  return (
    <Box
      key="map-legend"
      sx={[
        styles.root,
        {
          right: showPitchSlider ? 98 : 64,
          maxHeight: showBearingSlider
            ? `calc(100% - ${165 + attributionOffset}px)`
            : `calc(100% - ${88 + attributionOffset}px)`,
          maxWidth: showPitchSlider
            ? 'calc(100% - 106px)'
            : 'calc(100% - 80px)',
        },
      ]}
    >
      <Stack spacing={1} bgcolor="background.paper" {...props} />
    </Box>
  )
}
