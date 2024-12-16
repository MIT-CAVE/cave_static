import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  ClickAwayListener,
  FormControl,
  Grid2,
  InputAdornment,
  InputLabel,
  Popper,
  Stack,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { LuShapes } from 'react-icons/lu'
import { MdOutlineEdit } from 'react-icons/md'
import { RiSettings5Line } from 'react-icons/ri'
import { TbLogicAnd, TbMathFunction } from 'react-icons/tb'
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
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectPitchSliderToggleFunc,
  selectSettingsIconUrl,
  selectShowLegendGroupNamesFunc,
  selectSync,
} from '../../../data/selectors'
import {
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
    () => (getRangeOnZoom != null ? getRangeOnZoom(mapId) : {}),
    [getRangeOnZoom, mapId]
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

export const useLegend = (mapId) => {
  const [openId, setOpenId] = useState()

  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )

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

  const handleToggleLegendGroupNames = useMutateStateWithSync(
    () => ({
      path: ['maps', 'data', mapId, 'showLegendGroupNames'],
      value: !showLegendGroupNames,
    }),
    [mapId, showLegendGroupNames]
  )

  return {
    showLegendGroupNames,
    handleToggleLegendGroupNames,
    popperProps: {
      openId,
      anchorEl,
      handleClose,
      handleOpenById,
    },
  }
}

export const getNumLabel = (value, numberFormatRaw, gradientKey) => {
  // eslint-disable-next-line no-unused-vars
  const { unit, unitPlacement, ...numberFormat } = numberFormatRaw
  return NumberFormat.format(value, {
    ...numberFormat,
    // Formatting hierarchy: `props.*gradient.<key>` -> `settings.defaults.*gradient<key>` -> `props.<key>` -> `settings.defaults.<key>`
    ...{
      precision: numberFormat[gradientKey]?.precision || numberFormat.precision,
      notation: numberFormat[gradientKey]?.notation || numberFormat.notation,
      notationDisplay:
        numberFormat[gradientKey]?.notationDisplay ||
        numberFormat.notationDisplay,
    },
  })
}

export const getGradientLabel = (
  labels,
  values,
  index,
  numberFormat,
  group,
  gradientKey
) =>
  group || labels[index] == null
    ? getNumLabel(values[index], numberFormat, gradientKey)
    : labels[index]

export const getMinLabel = (labels, values, numberFormat, group, gradientKey) =>
  getGradientLabel(labels, values, 0, numberFormat, group, gradientKey)

export const getMaxLabel = (labels, values, numberFormat, group, gradientKey) =>
  getGradientLabel(
    labels,
    values,
    values.length - 1,
    numberFormat,
    group,
    gradientKey
  )

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
          sx={{ width: 'auto' }}
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
          onClickAway={() =>
            // event
            {
              // onClose(event)
            }
          }
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
