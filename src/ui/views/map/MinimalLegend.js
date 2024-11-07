import {
  Autocomplete,
  Badge,
  Button,
  ButtonBase,
  capitalize,
  ClickAwayListener,
  Divider,
  FormControl,
  Grid2,
  IconButton,
  InputAdornment,
  InputLabel,
  Paper,
  Popper,
  Portal,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  Typography,
} from '@mui/material'
import { color } from 'd3-color'
import { matchIsValidColor, MuiColorInput } from 'mui-color-input'
import * as R from 'ramda'
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
import useSizeSlider from './useSizeSlider'

import { mutateLocal } from '../../../data/local'
import {
  selectArcRange,
  selectArcTypeKeys,
  selectBearingSliderToggleFunc,
  selectGeoRange,
  selectLegendDataFunc,
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectNodeTypeKeys,
  selectNumberFormatPropsFn,
  selectPitchSliderToggleFunc,
  selectEffectiveNodesBy,
  selectSettingsIconUrl,
  selectSync,
  selectEffectiveArcsBy,
  selectEffectiveGeosBy,
} from '../../../data/selectors'
import { propId, statFns, statId } from '../../../utils/enums'
import { useMenu } from '../../../utils/hooks'
import { getStatLabel } from '../../../utils/stats'
import {
  EnhancedListbox,
  ListboxPropsContext,
  useIconDataLoader,
} from '../../compound/IconPicker'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import { FetchedIcon, OverflowText, Select } from '../../compound'

import {
  colorToRgba,
  forceArray,
  getContrastText,
  includesPath,
  NumberFormat,
  orderEntireDict,
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
    border: 2,
    borderColor: (theme) => theme.palette.grey[500],
    borderStyle: 'outset',
    borderRadius: 1,
  },
  legendGroup: {
    alignItems: 'start',
    mt: 1,
    px: 1,
    py: 0.5,
    border: 1,
    borderColor: 'rgb(128, 128, 128)',
    borderStyle: 'outset',
  },
  legendSection: {
    width: '100%',
    p: 1,
    pt: 2,
    boxSizing: 'border-box',
  },
  popper: {
    height: '100%',
    width: '400px',
    overflow: 'hidden',
    zIndex: 2,
  },
  popperContent: {
    maxHeight: '100%',
    maxWidth: '100%',
    p: 1.5,
    border: 1,
    boxSizing: 'border-box',
    borderColor: 'rgb(128, 128, 128)',
    // borderColor: (theme) => theme.palette.primary.main,
    borderStyle: 'outset',
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
  toggleGroup: {
    p: 1,
    borderRadius: '50%',
  },
  gradientRoot: {
    justifyContent: 'center',
    alignItems: 'center',
    m: 1,
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
  getRippleBox: (selected) => ({
    border: `1px ${selected ? 'inset' : 'outset'} rgb(128, 128, 128)`,
    borderRadius: 1,
  }),
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

const getMinLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'min', 'legendMinLabel')

const getMaxLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'max', 'legendMaxLabel')

const RippleBox = ({ selected, sx = [], ...props }) => (
  <ButtonBase
    // component="div"
    sx={[styles.getRippleBox(selected), ...forceArray(sx)]}
    {...props}
  />
)

const ColorPicker = ({ colorLabel, value, onClose, onChange }) => {
  const formattedColor = useMemo(() => {
    if (!matchIsValidColor(value)) return value
    return color(value).formatHex8().toLowerCase()
  }, [value])

  return (
    <ClickAwayListener onClickAway={onClose}>
      <MuiColorInput
        // size="small"
        color="error"
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
  numberFormat,
  onChangeColor,
}) => {
  const minCp = useColorPicker(onChangeColor)
  const maxCp = useColorPicker(onChangeColor)

  const { startGradientColor, endGradientColor } = valueRange
  const minLabel = getMinLabel(valueRange, numberFormat, group)
  const maxLabel = getMaxLabel(valueRange, numberFormat, group)

  const handleClick = useCallback(() => {
    minCp.handleOpen('startGradientColor', startGradientColor)()
    maxCp.handleOpen('endGradientColor', endGradientColor)()
  }, [endGradientColor, maxCp, minCp, startGradientColor])

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
        <Grid2 size="grow">
          <RippleBox
            selected={showColorPicker}
            sx={styles.getGradient(startGradientColor, endGradientColor)}
            onClick={handleClick}
          />
        </Grid2>
        <Grid2 size={3} sx={styles.gradientLabel}>
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
  colorByProps,
  onChangeColor,
}) => {
  const {
    colorPickerProps,
    showColorPicker,
    handleOpen,
    handleClose,
    handleChange: handleChangeRaw,
  } = useColorPicker(onChangeColor)

  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR || type === propId.TOGGLE
          ? colorByProps[colorBy].options[option].name
          : null
      return label || capitalize(option)
    },
    [colorBy, colorByProps, type]
  )
  const handleChange = useCallback(
    (event, value) => {
      handleChangeRaw(event, value, ['options', colorPickerProps.key, 'color'])
    },
    [handleChangeRaw, colorPickerProps.key]
  )
  const colorOptions = useMemo(
    () =>
      R.pipe(
        orderEntireDict, // Preserve order of options after state updates
        R.prop('options'),
        R.pluck('color')
      )(colorByProps[colorBy]),
    [colorBy, colorByProps]
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
              selected={option === colorPickerProps.key}
              sx={[
                styles.category,
                { bgcolor: value, color: getContrastText(value) },
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
    <FormControl fullWidth>
      <InputLabel id="group-calc-fn-label">Group Aggreg. Func.</InputLabel>
      <Select
        id="group-calc-fn"
        labelId="group-calc-fn-label"
        label="Group Aggreg. Func."
        getLabel={getStatLabel}
        startAdornment={
          <InputAdornment position="start">
            <IconClass size={24} />
          </InputAdornment>
        }
        {...{ optionsList, value, onSelect }}
      />
    </FormControl>
  )
}

const ColorLegend = ({
  group,
  valueRange,
  colorBy,
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
  // Find valid `colorBy` props
  const colorByProps = useMemo(
    () =>
      Object.entries(featureTypeProps).reduce((acc, [propId, prop]) => {
        const hasGradientColors =
          'startGradientColor' in prop && 'endGradientColor' in prop
        const hasColorOptions = Object.values(prop.options || {}).some(
          (value) => 'color' in value
        )

        if (hasGradientColors || hasColorOptions) {
          acc[propId] = prop
        }
        return acc
      }, {}),
    [featureTypeProps]
  )
  return (
    <Paper
      elevation={3}
      component={Stack}
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <FormControl fullWidth>
            <InputLabel id="color-by-label">Color by</InputLabel>
            <Select
              id="color-by"
              labelId="color-by-label"
              label="Color by"
              value={colorBy}
              optionsList={Object.keys(colorByProps)}
              getLabel={(prop) => featureTypeProps[prop].name || prop}
              onSelect={onSelectProp}
            />
          </FormControl>
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
          {...{ colorBy, colorByProps, onChangeColor }}
        />
      ) : (
        <NumericalColorLegend
          {...{ group, valueRange, numberFormat, onChangeColor }}
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

const PropIcon = ({ icon, selected, onClick, ...props }) => (
  <RippleBox sx={{ p: 1, borderRadius: '50%' }} {...{ selected, onClick }}>
    <FetchedIcon iconName={icon} {...props} />
  </RippleBox>
)

const SizeSlider = ({
  sizeLabel,
  value,
  onClose,
  onChange,
  onChangeCommitted,
}) => {
  const isRange = value.length > 1
  const [minValue, maxValue] = useMemo(
    () => (isRange ? [Math.min(...value), Math.max(...value)] : []),
    [isRange, value]
  )
  return (
    <ClickAwayListener onClickAway={onClose}>
      <Slider
        style={{
          // BUG: For some reason the `sx` prop doesn't work here for `mt` and `mb`
          marginTop: 40,
          marginBottom: 32,
          width: '85%',
          alignSelf: 'center',
          boxSizing: 'border-box',
        }}
        min={1}
        max={100}
        {...{ value }}
        marks={[
          {
            value: value[0],
            label: <OverflowText text={sizeLabel} sx={{ maxWidth: '64px' }} />,
          },
          ...(minValue > 16 || (!isRange && value[0] > 16)
            ? [{ value: 1, label: '1px' }]
            : []),
          ...(isRange
            ? [
                { value: value[0], label: 'Min' },
                { value: value[value.length - 1], label: 'Max' },
              ]
            : []),
          ...(maxValue < 83 || (!isRange && value[0] < 83)
            ? [{ value: 100, label: '100px' }]
            : []),
        ]}
        valueLabelDisplay="on"
        valueLabelFormat={(value) => `${value}px`}
        {...{ onChange, onChangeCommitted }}
      />
    </ClickAwayListener>
  )
}

const NumericalSizeLegend = ({
  valueRange,
  numberFormat,
  icon,
  group,
  onChangeSize,
}) => {
  const minSz = useSizeSlider(onChangeSize)
  const maxSz = useSizeSlider(onChangeSize)
  const [activeThumb, setActiveThumb] = useState()

  const { startSize, endSize } = valueRange
  const minLabel = getMinLabel(valueRange, numberFormat, group)
  const maxLabel = getMaxLabel(valueRange, numberFormat, group)

  const handleChange = useCallback(
    (event, value, thumb) => {
      setActiveThumb(thumb)
      // Only dispatch the change for the modified value
      const thumbChangeTrigger =
        minSz.showSizeSlider && thumb === 0
          ? minSz.handleChange
          : maxSz.showSizeSlider && (!minSz.showSizeSlider || thumb === 1)
            ? maxSz.handleChange
            : () => {
                console.error('This should never happen...')
              }
      thumbChangeTrigger(event, [value[thumb]])
    },
    [maxSz, minSz]
  )

  const handleChangeComitted = useCallback(
    (event, value) => {
      // Only dispatch the change for the modified value
      const thumbChangeComittedTrigger =
        minSz.showSizeSlider && activeThumb === 0
          ? minSz.handleChangeComitted
          : maxSz.showSizeSlider && (!minSz.showSizeSlider || activeThumb === 1)
            ? maxSz.handleChangeComitted
            : () => {
                console.error('This should never happen...')
              }
      thumbChangeComittedTrigger(event, [value[activeThumb]])
    },

    [activeThumb, maxSz, minSz]
  )

  const handleClose = useCallback(
    (event) => {
      minSz.handleClose(event)
      maxSz.handleClose(event)
    },
    [maxSz, minSz]
  )

  const showSizeSlider = minSz.showSizeSlider || maxSz.showSizeSlider
  return (
    <>
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

        <Grid2
          container
          size="grow"
          sx={{ alignItems: 'center', textAlign: 'center' }}
          spacing={1}
        >
          <Grid2 size={6}>
            {icon && (
              <PropIcon
                {...{ icon }}
                selected={minSz.showSizeSlider}
                size={minSz.sizeSliderProps.value ?? startSize}
                onClick={minSz.handleOpen('startSize', startSize)}
              />
            )}
          </Grid2>
          <Grid2 size={6}>
            {icon && (
              <PropIcon
                {...{ icon }}
                selected={maxSz.showSizeSlider}
                size={maxSz.sizeSliderProps.value ?? endSize}
                onClick={maxSz.handleOpen('endSize', endSize)}
              />
            )}
          </Grid2>
        </Grid2>

        <Grid2 size={3} sx={styles.gradientLabel}>
          <Typography variant="caption">Max</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={maxLabel} />
          </Typography>
        </Grid2>
      </Grid2>

      {showSizeSlider && (
        <SizeSlider
          value={[
            ...(minSz.sizeSliderProps.value != null
              ? [minSz.sizeSliderProps.value]
              : []),
            ...(maxSz.sizeSliderProps.value != null
              ? [maxSz.sizeSliderProps.value]
              : []),
          ]}
          onClose={handleClose}
          onChange={handleChange}
          onChangeCommitted={handleChangeComitted}
        />
      )}
    </>
  )
}

const CategoricalSizeLegend = ({
  type,
  sizeBy,
  sizeByProps,
  icon,
  onChangeSize,
}) => {
  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    handleClose,
    handleChange,
    handleChangeComitted: handleChangeComittedRaw,
  } = useSizeSlider(onChangeSize)

  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR || type === propId.TOGGLE
          ? sizeByProps[sizeBy].options[option].name
          : null
      return label || capitalize(option)
    },
    [sizeBy, sizeByProps, type]
  )
  const handleChangeComitted = useCallback(
    (event, value) => {
      handleChangeComittedRaw(event, value, [
        'options',
        sizeSliderProps.key,
        'size',
      ])
    },
    [handleChangeComittedRaw, sizeSliderProps.key]
  )

  const sizeOptions = useMemo(
    () =>
      R.pipe(
        orderEntireDict, // Preserve order of options after state updates
        R.prop('options'),
        R.map(R.propOr('1px', 'size'))
      )(sizeByProps[sizeBy]),
    [sizeBy, sizeByProps]
  )
  return (
    <>
      <OverflowText
        sx={styles.categoryRoot}
        marqueeProps={{ play: !showSizeSlider }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'center', alignItems: 'end' }}
        >
          {Object.entries(sizeOptions).map(([option, value]) => (
            <Stack key={option} sx={{ alignItems: 'center' }}>
              <PropIcon
                {...{ icon }}
                selected={option === sizeSliderProps.key}
                size={value}
                onClick={handleOpen(option, value)}
              />
              <Typography variant="caption">
                {getCategoryLabel(option)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </OverflowText>
      {showSizeSlider && (
        <SizeSlider
          sizeLabel={getCategoryLabel(sizeSliderProps.key)}
          value={sizeSliderProps.value}
          onClose={handleClose}
          onChange={handleChange}
          onChangeCommitted={handleChangeComitted}
        />
      )}
    </>
  )
}

const SizeLegend = ({
  valueRange,
  sizeBy,
  featureTypeProps,
  icon,
  group,
  groupCalcValue,
  onSelectProp,
  onSelectGroupCalc,
  onChangeSize,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const sizeByProp = featureTypeProps[sizeBy]
  const numberFormat = getNumberFormatProps(sizeByProp)
  const isCategorical = sizeByProp.type !== propId.NUMBER
  // Find valid `sizeBy` props
  const sizeByProps = useMemo(
    () =>
      Object.entries(featureTypeProps).reduce((acc, [propId, prop]) => {
        const hasSizeRange = 'startSize' in prop && 'endSize' in prop
        const hasSizeOptions = Object.values(prop.options || {}).some(
          (value) => 'size' in value
        )
        if (hasSizeRange || hasSizeOptions) {
          return { ...acc, [propId]: prop }
        }
        return acc
      }, {}),
    [featureTypeProps]
  )
  return (
    <Paper
      elevation={3}
      component={Stack}
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <FormControl fullWidth>
            <InputLabel id="size-by-label">Size by</InputLabel>
            <Select
              id="size-by"
              labelId="size-by-label"
              label="Size by"
              value={sizeBy}
              optionsList={Object.keys(sizeByProps)}
              getLabel={(option) => featureTypeProps[option].name || option}
              onSelect={onSelectProp}
            />
          </FormControl>
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
          {...{ sizeBy, sizeByProps, icon, onChangeSize }}
        />
      ) : (
        <NumericalSizeLegend
          {...{ valueRange, numberFormat, icon, group, onChangeSize }}
        />
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
          <FormControl fullWidth>
            <InputLabel id="height-by-label">Height by</InputLabel>
            <Select
              id="height-by"
              labelId="height-by-label"
              label="Height by"
              value={heightBy}
              optionsList={Object.keys(heightByOptions)}
              getLabel={(option) => featureTypeProps[option].name || option}
              onSelect={onSelectProp}
            />
          </FormControl>
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

const ShapePicker = ({
  label,
  value,
  options,
  groupBy,
  getIcon,
  getLabel,
  ListboxComponent,
  onChange,
}) => (
  <ListboxPropsContext.Provider value={{ getLabel, getIcon }}>
    <Autocomplete
      disableListWrap
      clearIcon={false}
      sx={{ p: 1 }}
      {...{ options, value, ListboxComponent, groupBy, onChange }}
      renderInput={({ InputProps, ...params }) => (
        <TextField
          {...{ label, ...params }}
          fullWidth
          autoFocus
          slotProps={{
            input: {
              ...InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <FetchedIcon size={24} iconName={getIcon(value)} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      // renderOption={(props, option, state) => [props, option, state.index]}
      {...(ListboxComponent == null && {
        renderOption: (props, option) => {
          const { key, ...optionProps } = props
          return (
            <Stack
              key={key}
              component="li"
              direction="row"
              spacing={1}
              {...optionProps}
            >
              <FetchedIcon size={24} iconName={getIcon(option)} />
              <Typography variant="subtitle2">
                {getLabel(option) ?? option}
              </Typography>
            </Stack>
          )
        },
        getOptionLabel: (option) => getLabel(option) ?? option,
      })}
    />
  </ListboxPropsContext.Provider>
)

const LegendRowDetails = ({
  mapId,
  legendGroupId,
  id,
  icon,
  name,
  value,
  allowGrouping,
  colorBy,
  sizeBy,
  heightBy,
  // shapeBy, // TODO: `shapeBy` would be a unifying property for `iconBy` and `lineBy`?
  shape,
  shapeLabel,
  shapePathEnd,
  shapeOptions,
  ListboxComponent,
  groupBy,
  getShapeIcon,
  getShapeLabel,
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
  containerRef,
  getRange,
  onChangeVisibility,
}) => {
  const [selected, setSelected] = useState(false)
  const [showShapePicker, setShowShapePicker] = useState(false)

  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)
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
    featureTypeProps,
    filtersPath: [...basePath, 'filters'],
    filters,
  })

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
  const clusterRange = useMemo(() => {
    if (getRangeOnZoom == null) return {}
    return getRangeOnZoom(mapId)
  }, [getRangeOnZoom, mapId])
  // Geos (only)
  const heightRange = useMemo(
    () => (heightBy != null ? getRange(id, heightBy, mapId) : null),
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
      const path = [...basePath, 'props', colorBy, ...forceArray(pathEnd)]
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
      const path = [...basePath, 'props', sizeBy, ...forceArray(pathEnd)]
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

  const handleChangeShape = useCallback(
    (event, value) => {
      const path = [...basePath, shapePathEnd]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
    },
    [basePath, dispatch, shapePathEnd, sync]
  )

  const handleClickShape = useCallback(() => {
    setShowShapePicker(!showShapePicker)
  }, [showShapePicker])

  const ShapeWrapper = shapeOptions ? ToggleButton : Fragment
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
      <Portal container={() => containerRef.current}>
        <Popper
          {...{ anchorEl }}
          placement="left"
          disablePortal
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
          ]}
          open={Boolean(anchorEl) || selected}
          onClose={handleCloseMenu}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Stack
            component={Paper}
            elevation={1}
            spacing={1}
            sx={styles.popperContent}
          >
            <Grid2 container sx={{ alignItems: 'center' }} spacing={1}>
              <Grid2 size="auto">
                <Switch
                  name="map-feature-switch"
                  size="small"
                  checked={value}
                  onClick={onChangeVisibility}
                />
              </Grid2>
              <Grid2 size="auto">
                <ShapeWrapper
                  {...(shapeOptions && {
                    value: 'shape',
                    sx: { p: 1, borderRadius: '50%' },
                    onClick: handleClickShape,
                  })}
                >
                  <FetchedIcon iconName={icon} size={24} />
                </ShapeWrapper>
              </Grid2>
              <Grid2 size="grow">
                <Typography variant="subtitle1" sx={{ textAlign: 'start' }}>
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
            {showShapePicker && (
              <ShapePicker
                {...{ groupBy, ListboxComponent }}
                value={shape}
                label={shapeLabel}
                options={shapeOptions}
                getIcon={getShapeIcon}
                getLabel={getShapeLabel}
                onChange={handleChangeShape}
              />
            )}
            <Divider sx={{ mx: -1.5 }} />

            <Stack spacing={1} sx={{ overflow: 'auto' }}>
              {colorBy != null && (
                <ColorLegend
                  valueRange={
                    group && clusterRange.color
                      ? clusterRange.color
                      : colorRange
                  }
                  {...{
                    legendGroupId,
                    mapId,
                    group,
                    colorBy,
                    featureTypeProps,
                  }}
                  groupCalcValue={groupCalcByColor}
                  onSelectProp={handleSelectProp('colorBy')}
                  onSelectGroupCalc={handleSelectGroupCalc('groupCalcByColor')}
                  onChangeColor={handleChangeColor}
                />
              )}
              {sizeBy != null && (
                <SizeLegend
                  valueRange={
                    group && clusterRange.size ? clusterRange.size : sizeRange
                  }
                  {...{
                    icon,
                    group,
                    sizeBy,
                    featureTypeProps,
                  }}
                  groupCalcValue={groupCalcBySize}
                  onSelectProp={handleSelectProp('sizeBy')}
                  onSelectGroupCalc={handleSelectGroupCalc('groupCalcBySize')}
                  onChangeSize={handleChangeSize}
                />
              )}
              {heightBy != null && (
                <HeightLegend
                  valueRange={heightRange}
                  {...{
                    legendGroupId,
                    mapId,
                    heightBy,
                    featureTypeProps,
                  }}
                  icon={<FetchedIcon iconName={icon} />}
                  onSelectProp={handleSelectProp('heightBy')}
                />
              )}
            </Stack>
          </Stack>
        </Popper>
      </Portal>
    </ToggleButton>
  )
}

const LegendRow = ({ id, mapFeaturesBy, settingsMode, ...props }) => {
  const featureTypeData = mapFeaturesBy(id, props.mapId)[0]
  const name = featureTypeData.name ?? id
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
            featureTypeProps={featureTypeData.props}
            {...{ id, name, ...props }}
          />
        </Grid2>
      )}
    </Grid2>
  )
}

const LegendRowNode = (props) => {
  const [options, setOptions] = useState([])
  const effectiveNodesBy = useSelector(selectEffectiveNodesBy)
  const getRange = useSelector(selectNodeRange)
  const iconUrl = useSelector(selectSettingsIconUrl)
  useIconDataLoader(iconUrl, setOptions, console.error)
  return (
    <LegendRow
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

const LegendRowArc = (props) => {
  const effectiveArcsBy = useSelector(selectEffectiveArcsBy)
  const getRange = useSelector(selectArcRange)
  const indexedOptions = {
    solid: { icon: 'ai/AiOutlineLine', label: 'Solid' },
    dotted: { icon: 'ai/AiOutlineEllipsis', label: 'Dotted' },
    dashed: { icon: 'ai/AiOutlineDash', label: 'Dashed' },
    // '3d': { icon: 'vsc/VscLoading', label: 'Arc' },
  }
  return (
    <LegendRow
      mapFeaturesBy={effectiveArcsBy}
      shapeOptions={Object.keys(indexedOptions)}
      shapePathEnd="lineBy"
      shape={props.lineBy ?? 'solid'}
      icon={indexedOptions[props.lineBy ?? 'solid']?.icon}
      shapeLabel="Select the line style"
      getShapeIcon={(option) => indexedOptions[option]?.icon}
      getShapeLabel={(option) => indexedOptions[option]?.label}
      {...{ getRange, ...props }}
    />
  )
}

const LegendRowGeo = (props) => {
  const effectiveGeosBy = useSelector(selectEffectiveGeosBy)
  const getRange = useSelector(selectGeoRange)
  return (
    <LegendRow mapFeaturesBy={effectiveGeosBy} {...{ getRange, ...props }} />
  )
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
  containerRef,
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
              {...{
                mapId,
                containerRef,
                legendGroupId,
                id,
                value,
                settingsMode,
                ...props,
              }}
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

const MinimalLegend = ({ mapId, containerRef, onChangeView }) => {
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
          containerRef={containerRef}
          onToggleLegendGroupName={handleToggleLegendGroupName}
        />
      )}
    </Paper>
  )
}

export default memo(MinimalLegend)
