import {
  Badge,
  Button,
  ButtonBase,
  capitalize,
  ClickAwayListener,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Popper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import { color } from 'd3-color'
import { matchIsValidColor, MuiColorInput } from 'mui-color-input'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { LuGroup, LuShapes, LuUngroup } from 'react-icons/lu'
import {
  MdFilterAlt,
  MdOutlineFactCheck,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md'
import { PiInfo } from 'react-icons/pi'
import { RiSettings5Line } from 'react-icons/ri'
import { TbLogicAnd, TbMathFunction } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'

import useColorPicker from './useColorPicker'
import useMapFilter from './useMapFilter'

import { mutateLocal } from '../../../data/local'
import {
  selectArcRange,
  selectArcTypeKeys,
  selectGeoRange,
  selectLegendDataFunc,
  selectLocalizedArcTypes,
  selectLocalizedGeoTypes,
  selectLocalizedNodeTypes,
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectNodeTypeKeys,
  selectNumberFormatPropsFn,
  selectSync,
} from '../../../data/selectors'
import { propId, statFns, statId } from '../../../utils/enums'
import { useMenu } from '../../../utils/hooks'
import { getStatLabel } from '../../../utils/stats'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import { FetchedIcon, OverflowText, Select } from '../../compound'

import {
  colorToRgba,
  forceArray,
  getContrastText,
  getLabelFn,
  includesPath,
  NumberFormat,
  withIndex,
} from '../../../utils'

const styles = {
  root: {
    width: 'auto',
    minWidth: '120px',
    maxWidth: '600px',
    p: (theme) => theme.spacing(0, 1, 1),
    mx: 0,
    color: 'text.primary',
    border: 1,
    borderColor: (theme) => theme.palette.grey[500],
    borderRadius: 1,
  },
  legendGroup: {
    alignItems: 'start',
    mt: 1,
    px: 1,
    py: 0.5,
  },
  legendSection: {
    width: '100%',
    p: 1,
    boxSizing: 'border-box',
  },
  popper: {
    width: '328px',
    position: 'absolute',
  },
  popperContent: {
    width: '100%',
    p: 1.5,
    border: 1,
    // borderColor: (theme) => theme.palette.primary.main,
  },
  categoryRoot: {
    width: '100%',
    mt: 1,
  },
  category: {
    height: '12px',
    minWidth: '12px',
    p: 1,
    boxSizing: 'content-box',
    textTransform: 'none',
  },
  gradientRoot: {
    justifyContent: 'center',
    alignItems: 'center',
    m: 1,
  },
  toggleGroup: {
    p: 1,
    borderRadius: '50%',
  },
  gradientLabel: {
    textAlign: 'center',
    maxWidth: '56px',
  },
  getGradient: (minColor, maxColor) => ({
    width: '100%',
    height: '24px',
    minWidth: '80px',
    backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
  }),
  unit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    border: 1,
    px: 1,
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
  },
  rippleBox: {
    border: '1px outset rgb(128, 128, 128)',
    borderRadius: 1,
  },
}

const RippleBox = ({ sx = [], ...props }) => (
  <ButtonBase
    component="div"
    sx={[styles.rippleBox, ...forceArray(sx)]}
    {...props}
  />
)

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

const getMinLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'min', 'legendMinLabel')

const getMaxLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'max', 'legendMaxLabel')

const ColorPicker = ({ colorLabel, value, onClose, onChange }) => {
  const formattedColor = useMemo(() => {
    if (!matchIsValidColor(value)) return value
    return color(value).formatHex8().toLowerCase()
  }, [value])

  return (
    <ClickAwayListener onClickAway={onClose}>
      <MuiColorInput
        // size="small"
        fullWidth={false}
        format="hex8"
        PopoverProps={{ onClose }}
        label={`Color picker \u279D ${colorLabel}`}
        style={{ marginTop: '20px' }}
        value={formattedColor}
        {...{ onChange }}
      />
    </ClickAwayListener>
  )
}

const NumericalColorLegend = ({
  group,
  valueRange,
  colorBy,
  colorByOptions,
  numberFormat,
  onChangeColor,
}) => {
  const minCp = useColorPicker(onChangeColor)
  const maxCp = useColorPicker(onChangeColor)

  const minColor = colorByOptions[colorBy].startGradientColor
  const maxColor = colorByOptions[colorBy].endGradientColor
  const minLabel = getMinLabel(valueRange, numberFormat, group)
  const maxLabel = getMaxLabel(valueRange, numberFormat, group)

  const handleClick = useCallback(() => {
    minCp.handleOpen('startGradientColor', minColor)()
    maxCp.handleOpen('endGradientColor', maxColor)()
  }, [maxColor, maxCp, minColor, minCp])

  const handleClose = useCallback(
    (event) => {
      minCp.handleClose(event)
      maxCp.handleClose(event)
    },
    [maxCp, minCp]
  )

  const showColorPicker = minCp.showColorPicker && maxCp.showColorPicker
  return (
    <>
      <Grid2 container spacing={1.5} sx={styles.gradientRoot}>
        <Grid2 size={3} sx={styles.gradientLabel}>
          <Typography variant="caption">Min</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={minLabel} />
          </Typography>
        </Grid2>

        {/* <Grid2 size={3} sx={styles.gradientLabel}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={minLabel} />
          </Typography>
        </Grid2> */}
        <Grid2 size="grow">
          <RippleBox
            sx={[
              styles.getGradient(minColor, maxColor),
              showColorPicker && { borderStyle: 'inset' },
            ]}
            onClick={handleClick}
          />
        </Grid2>
        {/* <Grid2 size={3} sx={styles.gradientLabel}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={maxLabel} />
          </Typography>
        </Grid2> */}

        <Grid2 item size={3} sx={styles.gradientLabel}>
          <Typography variant="caption">Max</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={maxLabel} />
          </Typography>
        </Grid2>
      </Grid2>
      {showColorPicker && (
        // BUG: For some reason the `sx` prop doesn't work here
        <Stack direction="row" spacing={1} style={{ marginTop: 0 }}>
          <ColorPicker
            colorLabel="Min"
            value={minCp.colorPickerProps.value}
            onChange={minCp.handleChange}
            onClose={handleClose}
          />
          <ColorPicker
            colorLabel="Max"
            value={maxCp.colorPickerProps.value}
            onChange={maxCp.handleChange}
            onClose={handleClose}
          />
        </Stack>
      )}
    </>
  )
}

const CategoricalColorLegend = ({
  type,
  colorBy,
  colorByOptions,
  featureTypeProps,
  onChangeColor,
}) => {
  const {
    colorPickerProps,
    showColorPicker,
    handleOpen,
    handleClose,
    handleChange,
  } = useColorPicker(onChangeColor)

  const colorOptions = colorByOptions[colorBy]
  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR
          ? featureTypeProps[colorBy].options[option].name
          : null
      return label || capitalize(option)
    },
    [colorBy, featureTypeProps, type]
  )

  return (
    <>
      <OverflowText
        marqueeProps={{ play: !showColorPicker }}
        sx={styles.categoryRoot}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {Object.entries(colorOptions).map(([option, value]) => (
            <RippleBox
              key={option}
              sx={[
                styles.category,
                option === colorPickerProps.key && {
                  border: 2,
                  borderStyle: 'inset',
                },
                {
                  bgcolor: value,
                  color: getContrastText(value),
                },
              ]}
              onClick={handleOpen(option, value)}
            >
              <Typography variant="caption">
                {getCategoryLabel(option)}
              </Typography>
            </RippleBox>
          ))}
        </Stack>
      </OverflowText>
      {showColorPicker && (
        <ColorPicker
          colorLabel={getCategoryLabel(colorPickerProps.key)}
          value={colorPickerProps.value}
          onChange={handleChange}
          onClose={handleClose}
        />
      )}
    </>
  )
}

const GroupCalcSelector = ({ type, value, onSelect }) => {
  const optionsList = useMemo(() => [...statFns[type].values()], [type])
  if (!statFns[type].has(value)) {
    // When a different prop type is selected and the
    // current aggr. fn is not supported, the first
    // element of the list of agg. Fns is chosen
    onSelect(optionsList[0])
  }
  const IconClass =
    type === propId.TOGGLE
      ? TbLogicAnd
      : type === propId.NUMBER
        ? TbMathFunction
        : LuShapes
  return (
    <Grid2
      container
      spacing={1}
      sx={{ pl: 0.5, justifyContent: 'center', alignItems: 'center' }}
      size={12}
    >
      <Grid2>
        <IconClass size={24} />
      </Grid2>
      <Grid2 size="grow">
        <Select
          fullWidth
          size="small"
          getLabel={getStatLabel}
          {...{ optionsList, value, onSelect }}
        />
      </Grid2>
    </Grid2>
  )
}

const ColorLegend = ({
  group,
  valueRange,
  colorBy,
  colorByOptions,
  featureTypeProps,
  groupCalcValue,
  onSelectProp,
  onSelectGroupCalc,
  onChangeColor,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const colorByProp = featureTypeProps[colorBy]
  const numberFormat = getNumberFormatProps(colorByProp)
  const isCategorical = colorByProp.type !== propId.NUMBER
  return (
    <Paper
      elevation={3}
      component={Stack}
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <Select
            fullWidth
            size="small"
            value={colorBy}
            optionsList={Object.keys(colorByOptions)}
            getLabel={(prop) => featureTypeProps[prop].name || prop}
            onSelect={onSelectProp}
          />
        </Grid2>
        {numberFormat.unit && (
          <Grid2 size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit} />
            </Typography>
          </Grid2>
        )}
      </Grid2>
      {isCategorical ? (
        <CategoricalColorLegend
          type={colorByProp.type}
          {...{
            colorBy,
            colorByOptions,
            featureTypeProps,
            onChangeColor,
          }}
        />
      ) : (
        <NumericalColorLegend
          {...{
            group,
            valueRange,
            colorBy,
            colorByOptions,
            numberFormat,
            onChangeColor,
          }}
        />
      )}
      {group && (
        <GroupCalcSelector
          type={colorByProp.type}
          value={groupCalcValue}
          onSelect={onSelectGroupCalc}
        />
      )}
    </Paper>
  )
}

const PropIcon = ({ icon, ...props }) => (
  <FetchedIcon
    iconName={icon}
    style={{ display: 'block', margin: '0 auto' }}
    {...props}
  />
)

const NumericalSizeLegend = ({ valueRange, numberFormat, icon, group }) => {
  const minLabel = getMinLabel(valueRange, numberFormat, group)
  const maxLabel = getMaxLabel(valueRange, numberFormat, group)
  return (
    <Grid2
      container
      spacing={0.5}
      sx={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Grid2 size={3} sx={styles.gradientLabel}>
        <Typography variant="caption">Min</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          <OverflowText text={minLabel} />
        </Typography>
      </Grid2>

      <Grid2 container size="grow" sx={{ alignItems: 'center' }}>
        <Grid2 container size={6}>
          {icon && <PropIcon {...{ icon }} size={valueRange.startSize} />}
        </Grid2>
        <Grid2 container size={6}>
          {icon && <PropIcon {...{ icon }} size={valueRange.endSize} />}
        </Grid2>
      </Grid2>

      <Grid2 item size={3} sx={styles.gradientLabel}>
        <Typography variant="caption">Max</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          <OverflowText text={maxLabel} />
        </Typography>
      </Grid2>
    </Grid2>
  )
}

const CategoricalSizeLegend = ({
  type,
  sizeBy,
  sizeByOptions,
  featureTypeProps,
  icon,
}) => {
  const sizeOptions = sizeByOptions[sizeBy]
  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR
          ? featureTypeProps[sizeBy].options[option].name
          : null
      return label || capitalize(option)
    },
    [featureTypeProps, sizeBy, type]
  )
  return (
    <OverflowText sx={styles.categoryRoot}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ justifyContent: 'center', alignItems: 'end' }}
      >
        {Object.entries(sizeOptions).map(([opt, val]) => (
          <Stack key={opt} sx={{ alignItems: 'center' }}>
            <PropIcon {...{ icon }} size={val} />
            <Typography variant="caption">{getCategoryLabel(opt)}</Typography>
          </Stack>
        ))}
      </Stack>
    </OverflowText>
  )
}

const SizeLegend = ({
  valueRange,
  sizeBy,
  sizeByOptions,
  featureTypeProps,
  icon,
  group,
  groupCalcValue,
  onSelectProp,
  onSelectGroupCalc,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const sizeByProp = featureTypeProps[sizeBy]
  const numberFormat = getNumberFormatProps(sizeByProp)
  const isCategorical = sizeByProp.type !== propId.NUMBER
  return (
    <Paper
      elevation={3}
      component={Stack}
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <Select
            fullWidth
            size="small"
            value={sizeBy}
            optionsList={Object.keys(sizeByOptions)}
            getLabel={(option) => featureTypeProps[option].name || option}
            onSelect={onSelectProp}
          />
        </Grid2>
        {numberFormat.unit && (
          <Grid2 size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit} />
            </Typography>
          </Grid2>
        )}
      </Grid2>
      {isCategorical ? (
        <CategoricalSizeLegend
          type={sizeByProp.type}
          {...{ sizeBy, sizeByOptions, featureTypeProps, icon }}
        />
      ) : (
        <NumericalSizeLegend {...{ valueRange, numberFormat, icon, group }} />
      )}
      {group && (
        <GroupCalcSelector
          type={sizeByProp.type}
          value={groupCalcValue}
          onSelect={onSelectGroupCalc}
        />
      )}
    </Paper>
  )
}

const HeightLegend = ({
  valueRange,
  heightBy,
  heightByOptions,
  featureTypeProps,
  icon,
  onSelectProp,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const heightByProp = featureTypeProps[heightBy]
  const numberFormat = getNumberFormatProps(heightByProp)
  const isCategorical = heightByProp.type !== propId.NUMBER

  const renderNumericHeight = () => {
    return (
      <Grid2 container spacing={1}>
        <Grid2 size={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Min
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.min}
          </Typography>
        </Grid2>

        <Grid2 size={6} container alignItems="center" justifyContent="center">
          <Grid2 container size={6} alignItems="center" justifyContent="center">
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  height: `${valueRange.min}px`,
                  width: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  transform: 'rotate(90deg)',
                }}
              />
            )}
          </Grid2>
          <Grid2 container size={6} alignItems="center" justifyContent="center">
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  height: `${valueRange.max}px`,
                  width: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  transform: 'rotate(90deg)',
                }}
              />
            )}
          </Grid2>
        </Grid2>

        <Grid2 size={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Max
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.max}
          </Typography>
        </Grid2>
      </Grid2>
    )
  }

  const renderCategoricalHeight = () => (
    <Stack direction="row" spacing={1.5} justifyContent="center">
      {Object.entries(heightByOptions).map(([category]) => (
        <Paper key={category} sx={{ padding: 0.5, textAlign: 'center' }}>
          <Typography variant="caption">{category}</Typography>
        </Paper>
      ))}
    </Stack>
  )

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <Select
            fullWidth
            size="small"
            value={heightBy}
            optionsList={Object.keys(heightByOptions)}
            getLabel={(option) => featureTypeProps[option].name || option}
            onSelect={onSelectProp}
          />
        </Grid2>
        {numberFormat.unit && (
          <Grid2 size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit} />
            </Typography>
          </Grid2>
        )}
      </Grid2>

      {isCategorical ? renderCategoricalHeight() : renderNumericHeight()}
    </Stack>
  )
}

const LegendRowDetails = ({
  mapId,
  legendGroupId,
  id,
  icon,
  name,
  value,
  allowGrouping,
  colorBy,
  colorByOptions,
  sizeBy,
  sizeByOptions,
  heightBy,
  heightByOptions,
  group,
  groupCalcByColor = statId.COUNT,
  groupCalcBySize = statId.COUNT,
  filters = [
    {
      id: 0,
      type: 'group',
      groupId: 0,
      logic: 'and',
      depth: 0,
      edit: false,
    },
  ],
  featureTypeProps,
  getRange,
  onChangeVisibility,
}) => {
  const [selected, setSelected] = useState(false)

  const getRangeOnZoom = useSelector(selectNodeRangeAtZoomFunc)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const basePath = useMemo(
    () => ['maps', 'data', mapId, 'legendGroups', legendGroupId, 'data', id],
    [id, legendGroupId, mapId]
  )

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()
  const {
    filterOpen,
    labelStart,
    numActiveFilters,
    isFilterDisabled,
    filterableProps,
    filterableExtraProps,
    handleOpenFilter,
    handleCloseFilter,
    handleSaveFilters,
  } = useMapFilter({
    mapId,
    group,
    colorByOptions,
    featureTypeProps,
    filtersPath: [...basePath, 'filters'],
    filters,
  })

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

  const handleSelectProp = useCallback(
    (pathEnd) => (value, event) => {
      const path = [...basePath, pathEnd]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      event.stopPropagation()
    },
    [basePath, dispatch, sync]
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

  return (
    <ToggleButton
      size="small"
      color="primary"
      value="details"
      {...{ selected }}
      onMouseEnter={handleOpenMenu}
      onMouseLeave={selected ? null : handleCloseMenu}
      onClick={() => setSelected(!selected)}
    >
      <Badge color="info" variant="dot" invisible={numActiveFilters < 1}>
        <PiInfo />
      </Badge>
      <Popper
        {...{ anchorEl }}
        placement="right"
        sx={styles.popper}
        open={Boolean(anchorEl) || selected}
        onClose={handleCloseMenu}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <Grid2
          component={Paper}
          elevation={1}
          container
          spacing={1}
          sx={styles.popperContent}
          direction="column"
        >
          <Grid2 container sx={{ alignItems: 'center' }}>
            <Grid2 size="auto">
              <Switch
                size="small"
                checked={value}
                onClick={onChangeVisibility}
              />
            </Grid2>
            <Grid2 size="auto">
              <FetchedIcon iconName={icon} />
            </Grid2>
            <Grid2 size="grow">
              <Typography variant="subtitle">
                <OverflowText text={name} />
              </Typography>
            </Grid2>
            <Grid2 size="auto">
              {allowGrouping && (
                <ToggleButton
                  color={group ? 'primary' : null}
                  selected={group}
                  value={group}
                  sx={styles.toggleGroup}
                  onClick={handleToggleGroup}
                >
                  {group ? <LuGroup size={24} /> : <LuUngroup size={24} />}
                </ToggleButton>
              )}
              {/* Filter */}
              <DataGridModal
                open={filterOpen}
                label="Chart Data Filter"
                labelExtra={`(${labelStart ? `${labelStart} \u279D ` : ''}${name})`}
                onClose={handleCloseFilter}
              >
                <GridFilter
                  {...{ filterableExtraProps }}
                  filterables={filterableProps}
                  defaultFilters={filters}
                  onSave={handleSaveFilters}
                />
              </DataGridModal>
              <IconButton
                disabled={isFilterDisabled}
                onClick={handleOpenFilter}
              >
                <Badge
                  color={isFilterDisabled ? 'default' : 'info'}
                  badgeContent={numActiveFilters}
                >
                  <MdFilterAlt />
                </Badge>
              </IconButton>
            </Grid2>
          </Grid2>
          <Divider sx={{ mx: -1.5 }} />
          {colorBy != null && (
            <>
              <Typography variant="subtitle2">Color by</Typography>
              <ColorLegend
                valueRange={
                  group && clusterRange.color ? clusterRange.color : colorRange
                }
                {...{
                  legendGroupId,
                  mapId,
                  group,
                  colorBy,
                  colorByOptions,
                  featureTypeProps,
                }}
                groupCalcValue={groupCalcByColor}
                onSelectProp={handleSelectProp('colorBy')}
                onSelectGroupCalc={handleSelectGroupCalc('groupCalcByColor')}
                onChangeColor={handleChangeColor}
              />
            </>
          )}
          {sizeBy != null && (
            <>
              <Typography variant="subtitle2">Size by</Typography>
              <SizeLegend
                valueRange={
                  group && clusterRange.size ? clusterRange.size : sizeRange
                }
                {...{
                  icon,
                  group,
                  sizeBy,
                  sizeByOptions,
                  featureTypeProps,
                }}
                groupCalcValue={groupCalcBySize}
                onSelectProp={handleSelectProp('sizeBy')}
                onSelectGroupCalc={handleSelectGroupCalc('groupCalcBySize')}
              />
            </>
          )}
          {heightBy != null && (
            <>
              <Typography variant="subtitle2">Height by</Typography>
              <HeightLegend
                valueRange={heightRange}
                {...{
                  legendGroupId,
                  mapId,
                  heightBy,
                  heightByOptions,
                  featureTypeProps,
                }}
                onSelectProp={handleSelectProp('heightBy')}
                icon={<FetchedIcon iconName={icon} />}
              />
            </>
          )}
        </Grid2>
      </Popper>
    </ToggleButton>
  )
}

const LegendRow = ({ id, featureTypeData, settingsMode, ...props }) => {
  const name = getLabelFn(featureTypeData, id)
  return (
    <Grid2
      key={id}
      container
      spacing={1}
      sx={{ alignItems: 'center', width: '100%' }}
    >
      {settingsMode && (
        <Grid2 size="auto">
          <Switch
            name={`cave-toggle-map-${id}`}
            size="small"
            checked={props.value}
            onClick={props.onChangeVisibility}
          />
        </Grid2>
      )}
      <Grid2 size="auto">
        <FetchedIcon iconName={props.icon} />
      </Grid2>
      <Grid2 size="grow" sx={{ textAlign: 'start' }}>
        <Typography variant="caption">{name}</Typography>
      </Grid2>
      {!settingsMode && (
        <Grid2 size="auto">
          <LegendRowDetails
            featureTypeProps={featureTypeData[id].props}
            {...{ id, name, ...props }}
          />
        </Grid2>
      )}
    </Grid2>
  )
}

const LegendRowNode = (props) => {
  const nodeTypes = useSelector(selectLocalizedNodeTypes)
  const getRange = useSelector(selectNodeRange)
  return <LegendRow featureTypeData={nodeTypes} {...{ getRange, ...props }} />
}

const LegendRowArc = (props) => {
  const arcTypes = useSelector(selectLocalizedArcTypes)
  const getRange = useSelector(selectArcRange)
  const icon = useMemo(
    () =>
      props.lineBy === 'dotted'
        ? 'ai/AiOutlineEllipsis'
        : props.lineBy === 'dashed'
          ? 'ai/AiOutlineDash'
          : props.lineBy === '3d'
            ? 'vsc/VscLoading'
            : 'ai/AiOutlineLine',
    [props.lineBy]
  )
  return (
    <LegendRow featureTypeData={arcTypes} {...{ icon, getRange, ...props }} />
  )
}

const LegendRowGeo = (props) => {
  const geoTypes = useSelector(selectLocalizedGeoTypes)
  const getRange = useSelector(selectGeoRange)
  return <LegendRow featureTypeData={geoTypes} {...{ getRange, ...props }} />
}

const MapFeature = ({
  mapId,
  legendGroupId,
  id,
  value,
  settingsMode,
  ...props
}) => {
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const handleChangeVisibility = useCallback(
    (mapFeatureType) => (event) => {
      const path = [
        'maps',
        'data',
        mapId,
        'legendGroups',
        legendGroupId,
        'data',
        mapFeatureType,
        'value',
      ]
      dispatch(
        mutateLocal({
          path,
          sync: !includesPath(Object.values(sync), path),
          value: event.target.checked ?? true,
        })
      )
      event.stopPropagation()
    },
    [dispatch, legendGroupId, mapId, sync]
  )

  // const handle

  const LegendRowClass = nodeTypes.includes(id)
    ? LegendRowNode
    : arcTypes.includes(id)
      ? LegendRowArc
      : LegendRowGeo

  return (
    <LegendRowClass
      {...{ mapId, legendGroupId, id, value, settingsMode, ...props }}
      onChangeVisibility={handleChangeVisibility(id)}
    />
  )
}

const StyledWrapper = ({ show, children }) =>
  show ? (
    <Paper component={Stack} spacing={0.5} sx={styles.legendGroup}>
      {children}
    </Paper>
  ) : (
    children
  )

const LegendGroup = ({
  mapId,
  legendGroup,
  settingsMode,
  showLegendGroupName,
  onToggleLegendGroupName,
}) => {
  const legendGroupData = useMemo(
    () => withIndex(legendGroup.data || {}),
    [legendGroup]
  )
  const isAnyMapFeatureVisible = useMemo(
    () => settingsMode || legendGroupData.some(({ value }) => value),
    [legendGroupData, settingsMode]
  )
  const isLegendGroupNameVisible = settingsMode || showLegendGroupName

  return isAnyMapFeatureVisible ? (
    <StyledWrapper show={isLegendGroupNameVisible}>
      {isLegendGroupNameVisible && (
        <Grid2 container spacing={1} sx={{ alignItems: 'center' }}>
          {settingsMode && (
            <Grid2 size="auto">
              <IconButton
                size="small"
                color="primary"
                onClick={onToggleLegendGroupName}
              >
                {showLegendGroupName ? (
                  <MdOutlineVisibility />
                ) : (
                  <MdOutlineVisibilityOff />
                )}
              </IconButton>
            </Grid2>
          )}
          <Grid2 size="grow">
            <Typography variant="subtitle1">{legendGroup.name}</Typography>
          </Grid2>
        </Grid2>
      )}
      {legendGroupData.map(({ id, value, ...props }, index) => {
        const legendGroupId = legendGroup.id
        return value || settingsMode ? (
          <Fragment key={id}>
            {index > 0 && <Divider sx={{ opacity: 0.6, width: '100%' }} />}
            <MapFeature
              {...{ mapId, legendGroupId, id, value, settingsMode, ...props }}
            />
          </Fragment>
        ) : null
      })}
    </StyledWrapper>
  ) : null
}

const LegendGroups = ({ mapId, ...props }) => {
  const getLegendData = useSelector(selectLegendDataFunc)
  const legendData = useMemo(
    () => withIndex(getLegendData(mapId)),
    [getLegendData, mapId]
  )
  const showWrapper = useMemo(() => {
    const isAnyMapFeatureVisible = legendData.some((legendGroup) =>
      Object.values(legendGroup.data).some((mapFeature) => mapFeature.value)
    )
    return (
      !props.settingsMode &&
      !props.showLegendGroupName &&
      isAnyMapFeatureVisible
    )
  }, [legendData, props.settingsMode, props.showLegendGroupName])
  return (
    <StyledWrapper show={showWrapper}>
      {legendData.map((legendGroup) => (
        <LegendGroup
          key={legendGroup.id}
          {...{ mapId, legendGroup, ...props }}
        />
      ))}
    </StyledWrapper>
  )
}

const LegendSettings = ({ mapId, onChangeView, ...props }) => (
  <Stack>
    <LegendGroups settingsMode {...{ mapId, ...props }} />
    <Button
      variant="contained"
      color="warning"
      sx={{ mt: 1.5 }}
      onClick={onChangeView}
    >
      Switch to Classic View
    </Button>
  </Stack>
)

const MinimalLegend = ({ mapId, onChangeView }) => {
  const [settingsMode, setSettingsMode] = useState(false)
  const [showLegendGroupName, setShowLegendGroupName] = useState(true)

  const handleToggleLegendGroupName = useCallback(() => {
    setShowLegendGroupName(!showLegendGroupName)
  }, [showLegendGroupName])

  return (
    <Paper elevation={12} sx={styles.root}>
      <Grid2 container spacing={1} sx={{ alignItems: 'center', px: 0.8 }}>
        <Grid2 size="grow" sx={{ textAlign: 'start' }}>
          <Typography variant="h6">
            {settingsMode ? 'Settings' : 'Legend'}
          </Typography>
        </Grid2>
        <Grid2 size="auto">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSettingsMode(!settingsMode)
            }}
          >
            {settingsMode ? <MdOutlineFactCheck /> : <RiSettings5Line />}
          </IconButton>
        </Grid2>
      </Grid2>

      {settingsMode ? (
        <LegendSettings
          mapId={mapId}
          showLegendGroupName={showLegendGroupName}
          onChangeView={onChangeView}
          onToggleLegendGroupName={handleToggleLegendGroupName}
        />
      ) : (
        <LegendGroups
          mapId={mapId}
          showLegendGroupName={showLegendGroupName}
          onToggleLegendGroupName={handleToggleLegendGroupName}
        />
      )}
    </Paper>
  )
}

export default memo(MinimalLegend)
