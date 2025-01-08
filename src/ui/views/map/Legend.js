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
  Grid2,
  InputAdornment,
  InputLabel,
  Paper,
  Popper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
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

import { mutateLocal } from '../../../data/local'
import {
  selectArcRange,
  selectBearingSliderToggleFunc,
  selectEffectiveArcsBy,
  selectEffectiveGeosBy,
  selectEffectiveNodesBy,
  selectGeoRange,
  selectLegendLayoutFunc,
  selectLegendViewFunc,
  selectLegendWidthFunc,
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectPitchSliderToggleFunc,
  selectSettingsIconUrl,
  selectShowLegendGroupNamesFunc,
  selectSync,
} from '../../../data/selectors'
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
  getScaleParamDefaults,
  getScaleParamLabel,
  scaleIndexedOptions,
} from '../../../utils/scales'
import { getStatFuncsByType, getStatLabel } from '../../../utils/stats'
import { EnhancedListbox, useIconDataLoader } from '../../compound/ShapePicker'

import { FetchedIcon, NumberInput, Select } from '../../compound'

import {
  forceArray,
  getColorString,
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
      border: '1px solid rgb(128 128 128)',
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
  mapId,
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
  const handleToggleGroup = useMutateStateWithSync(
    (event) => {
      event.stopPropagation()
      return { path: [...basePath, 'group'], value: !group }
    },
    [basePath, group]
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
        handleSelectGroupCalc(groupCalcPathTail)(defaultGroupCalc)
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
    handleSelectGroupCalc,
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

export const useGradientLabels = ({
  labels,
  values,
  rawValues,
  numberFormat: numberFormatRaw,
  group,
  scale,
}) => {
  const lastIndex = values.length - 1
  const isStepScale = scale === scaleId.STEP

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
      const label = labels[index]
      return group || label == null || values[index] !== rawValues[index]
        ? getFormattedValueAt(index)
        : label
    },
    [getFormattedValueAt, group, labels, rawValues, values]
  )

  const getAttrLabelAt = useCallback(
    (index) =>
      index > 0 && index < lastIndex // Within the bounds
        ? isStepScale
          ? `[${getFormattedValueAt(index - 1)}, ${getFormattedValueAt(index)})${labels[index] != null ? ` "${getLabel(index)}"` : ''}`
          : `"${getLabel(index)}"`
        : isStepScale
          ? `${index < 1 ? `(-\u221E, ${getFormattedValueAt(index)})` : `[${getFormattedValueAt(index - 1)}, \u221E)`}`
          : `${index < 1 ? 'Min' : 'Max'}`,
    [getFormattedValueAt, getLabel, isStepScale, labels, lastIndex]
  )

  const getValueLabelAt = useCallback(
    (index) => {
      const label = getLabel(index)
      const isValueAdjusted = values[index] !== rawValues[index]
      return index > 0 && index < lastIndex // Within the bounds
        ? isStepScale
          ? `Threshold \u279D [${getFormattedValueAt(index - 1)}, \u2B07)${labels[index] != null ? ` "${label}"` : ''}`
          : `Value${
              isValueAdjusted
                ? ` \u279D Adjusted to ${label}`
                : labels[index] != null
                  ? ` \u279D "${label}"`
                  : ''
            }`
        : isStepScale
          ? index < 1
            ? `Threshold \u279D (-\u221E, ${getFormattedValueAt(index)})`
            : null // This should not happen as the max value for a step function is not displayed
          : `Value \u279D ${
              isValueAdjusted
                ? `Adjusted to ${label}`
                : index < 1
                  ? 'Min'
                  : 'Max'
            }`
    },
    [
      getFormattedValueAt,
      getLabel,
      isStepScale,
      labels,
      lastIndex,
      rawValues,
      values,
    ]
  )

  const getAdjustedLabel = useCallback(
    (label, index) =>
      values[index] === rawValues[index] ? label : `${label} (Adjusted)`,
    [rawValues, values]
  )

  return {
    isStepScale,
    getLabel,
    getAdjustedLabel,
    getAttrLabelAt,
    getValueLabelAt,
  }
}

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

export const LegendPopper = ({
  mapId,
  IconComponent,
  children,
  slotProps = {},
  anchorEl,
  onOpen,
  onClose,
  ...props
}) => {
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)

  const open = Boolean(anchorEl)
  const {
    badge: { showBadge, reactIcon, ...muiBadgeProps } = {},
    ...muiSlotProps
  } = slotProps

  return (
    <ToggleButton
      size="small"
      color="primary"
      value="details"
      // Toggle when clicking on the opened popper
      onClick={anchorEl == null ? onOpen : onClose}
      selected={open}
      {...props}
    >
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
            placement="left"
            disablePortal
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
                  ? 'calc(100% - 164px)'
                  : 'calc(100% - 128px)',
              },
              ...forceArray(muiSlotProps.popper?.sx),
            ]}
          >
            {children}
          </Popper>
        </ClickAwayListener>
      </MapPortal>
    </ToggleButton>
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
  const effectiveArcsBy = useSelector(selectEffectiveArcsBy)
  const getRange = useSelector(selectArcRange)
  const indexedOptions = {
    solid: { icon: 'ai/AiOutlineLine', label: 'Solid' },
    dotted: { icon: 'ai/AiOutlineEllipsis', label: 'Dotted' },
    dashed: { icon: 'ai/AiOutlineDash', label: 'Dashed' },
    // '3d': { icon: 'vsc/VscLoading', label: 'Arc' },
  }
  return (
    <LegendRowComponent
      mapFeaturesBy={effectiveArcsBy}
      shapeOptions={Object.keys(indexedOptions)}
      shapePathEnd="lineStyle"
      shape={props.lineStyle ?? 'solid'}
      icon={indexedOptions[props.lineStyle ?? 'solid']?.icon}
      shapeLabel="Select the line style"
      getShapeIcon={(option) => indexedOptions[option]?.icon}
      getShapeLabel={(option) => indexedOptions[option]?.label}
      {...{ getRange, ...props }}
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

const FormSwitch = ({ disabled, value, checked, label, onChange }) => (
  <FormControlLabel
    {...{ disabled, value, label }}
    control={<Switch name={`cave-${value}`} {...{ checked, onChange }} />}
    labelPlacement="end"
  />
)

export const LegendSettings = ({
  mapId,
  expandAll,
  showAdvancedControls,
  onExpandAll,
  onToggleAdvancedControls,
}) => {
  const legendView = useSelector(selectLegendViewFunc)(mapId)
  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )
  const legendLayout = useSelector(selectLegendLayoutFunc)(mapId)
  const legendWidth = useSelector(selectLegendWidthFunc)(mapId)

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
    () => ({
      path: ['maps', 'data', mapId, 'showLegendGroupNames'],
      value: !showLegendGroupNames,
    }),
    [mapId, showLegendGroupNames]
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
        {isFullView && (
          <FormSwitch
            disabled
            value="toggle-advanced-controls"
            label="Show advanced controls"
            checked={showAdvancedControls}
            onChange={onToggleAdvancedControls}
          />
        )}
      </FormGroup>

      <Stack>
        <Typography variant="subtitle2" sx={{ textAlign: 'start', pl: 0.5 }}>
          Layout width
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
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
  mapId,
  slotProps = {},
  sx = [],
  popperProps: { anchorEl, openId, handleOpenById, handleClose },
  children,
}) => (
  <Grid2
    container
    spacing={1}
    sx={[{ alignItems: 'center', px: 0.8, my: 1 }, ...forceArray(sx)]}
  >
    <Grid2 size="grow" sx={{ textAlign: 'start' }}>
      <Typography variant="h6" {...slotProps.label}>
        {label}
      </Typography>
    </Grid2>
    <Grid2 size="auto">
      <LegendPopper
        sx={styles.toggleButton}
        IconComponent={RiSettings5Line}
        {...{ mapId, slotProps }}
        anchorEl={
          openId === LEGEND_SETTINGS_POPPER_ID || openId == null
            ? anchorEl
            : null
        }
        onOpen={handleOpenById(LEGEND_SETTINGS_POPPER_ID)}
        onClose={handleClose}
      >
        {children}
      </LegendPopper>
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
      <Stack spacing={1} bgcolor="background.paper" {...props} />
    </Box>
  )
}
