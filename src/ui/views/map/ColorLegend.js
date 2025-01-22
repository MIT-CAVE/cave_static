import {
  capitalize,
  FormControl,
  Grid2,
  IconButton,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useMemo } from 'react'
import { TbFocusAuto } from 'react-icons/tb'
import { useSelector } from 'react-redux'

import {
  GroupCalcSelector,
  RippleBox,
  ScaleSelector,
  useGradient,
  WithEditBadge,
} from './Legend'

import { selectLegendNumberFormatFunc } from '../../../data/selectors'
import { propId, scaleId } from '../../../utils/enums'
import { getScaledValueAlt } from '../../../utils/scales'
import ColorPicker, { useColorPicker } from '../../compound/ColorPicker'

import { NumberInput, OverflowText, Select } from '../../compound'

import { getContrastText, orderEntireDict, parseGradient } from '../../../utils'

const styles = {
  legendSection: {
    height: '100%',
    width: '100%',
    p: 1,
    pt: 2,
    border: '1px outset rgb(128 128 128)',
    boxSizing: 'border-box',
  },
  marqueeRoot: {
    height: '100%',
    width: '100%',
    pt: 0.75,
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
    px: 1,
    border: '1px solid rgb(128 128 128)',
    boxSizing: 'border-box',
  },
  rangeRoot: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeLabel: {
    textAlign: 'center',
    maxWidth: '80px',
  },
  getGradient: (gradientColors) => ({
    width: '100%',
    height: '24px',
    minWidth: '80px',
    background: `linear-gradient(to right, ${gradientColors})`,
  }),
  valueInput: {
    mt: '20px !important',
    flex: '1 1 auto',
    fieldset: {
      borderWidth: '2px !important',
    },
  },
}

const WithEditColorBadge = ({ showBadge, ...props }) => (
  <WithEditBadge
    editing={showBadge}
    sx={{ display: 'flex' }}
    // overlap="rectangular"
    slotProps={{ badge: { sx: { right: '4px' } } }}
    {...props}
  />
)

const NumericalColorLegend = ({
  group,
  valueRange,
  numberFormat,
  // anyNullValue, // TODO: Implement `fallback` UI
  onChangeColor,
  onChangeValueAt,
}) => {
  const {
    showColorPicker: showColorPickers,
    handleOpen,
    handleChange,
    handleClose,
  } = useColorPicker(onChangeColor)

  const { colors, values, rawValues, labels } = useMemo(
    () => parseGradient('color', numberFormat.precision)(valueRange),
    [numberFormat.precision, valueRange]
  )

  const {
    isStepScale,
    lastIndex,
    minAuto,
    maxAuto,
    getLabel,
    getAttrLabelAt: getColorLabelAt,
    getAdjustedLabel,
    getValueLabelAt,
    handleSetAutoValueAt,
  } = useGradient({
    labels,
    values,
    rawValues,
    gradient: valueRange.gradient,
    numberFormat,
    group,
    onChangeValueAt,
  })

  const gradientStyle = useMemo(() => {
    const { scale, scaleParams } = valueRange.gradient
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    const scaledValues = R.map((value) =>
      getScaledValueAlt(
        [minValue, maxValue],
        [0, 100],
        value,
        isStepScale ? scaleId.LINEAR : scale,
        scaleParams
      )
    )(values)

    const gradientColors =
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

    return styles.getGradient(
      gradientColors.filter((value) => value != null).join(', ')
    )
  }, [colors, isStepScale, lastIndex, valueRange, values])

  const handleChangeColorAt = useCallback(
    (index) => (value, colorOutputs) => {
      const pathTail =
        index == null // Updating fallback color?
          ? ['fallback', 'color']
          : ['gradient', 'data', index, 'color']
      handleChange(value, colorOutputs, pathTail)
    },
    [handleChange]
  )

  return (
    <>
      <Grid2 container spacing={1.5} sx={styles.rangeRoot} wrap="nowrap">
        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption" noWrap>
            <OverflowText text={getAdjustedLabel('Min', 0)} />
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={getLabel(0)} />
          </Typography>
        </Grid2>
        <Grid2 size="grow">
          <WithEditColorBadge showBadge={showColorPickers}>
            <RippleBox
              selected={showColorPickers}
              sx={gradientStyle}
              onClick={handleOpen(null, null)}
            />
          </WithEditColorBadge>
        </Grid2>
        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">
            <OverflowText text={getAdjustedLabel('Max', lastIndex)} />
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={getLabel(lastIndex)} />
          </Typography>
        </Grid2>
      </Grid2>

      {showColorPickers && (
        <Stack spacing={1} style={{ marginTop: 0 }}>
          {rawValues.map((value, index) => (
            <Stack key={index} direction="row" spacing={1}>
              <ColorPicker
                colorLabel={getColorLabelAt(index)}
                value={colors[index]}
                onChange={handleChangeColorAt(index)}
                onClose={handleClose}
              />
              {
                // Do not display the max value for a step function
                // scale, as it does not affect the function output
                !(isStepScale && index === lastIndex) && (
                  <NumberInput
                    color="warning"
                    sx={styles.valueInput}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 0, pr: 1.75 },
                      },
                    }}
                    endAdornments={
                      // Show the auto-min/max button when the min/max value is custom
                      (index < 1 && !minAuto) ||
                      (index === lastIndex && !maxAuto) ? (
                        <IconButton
                          size="small"
                          onClick={handleSetAutoValueAt(index)}
                        >
                          <TbFocusAuto />
                        </IconButton>
                      ) : null
                    }
                    label={getValueLabelAt(index)}
                    {...{ value, numberFormat }}
                    onClickAway={onChangeValueAt(index)}
                  />
                )
              }
            </Stack>
          ))}
        </Stack>
      )}
    </>
  )
}

const CategoricalColorLegend = ({
  type,
  colorByProp,
  anyNullValue,
  onChangeColor,
}) => {
  const {
    colorPickerProps,
    showColorPicker,
    handleOpen,
    handleClose,
    handleChange: handleChangeRaw,
  } = useColorPicker(onChangeColor)

  const colorOptions = useMemo(() => {
    const { options, fallback } = colorByProp
    return R.pipe(
      orderEntireDict, // Preserve order of options after state updates
      // Add fallback color for null values, if available
      R.when(
        R.always(anyNullValue && fallback?.color != null),
        R.assoc('null', fallback)
      ),
      R.map(
        R.applySpec({
          name: R.prop('name'),
          color: R.propOr('#000', 'color'), // In case `color` is missing
          // TODO: Think more about this: unspecified `color`s
        })
      )
    )(options)
  }, [anyNullValue, colorByProp])

  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR || type === propId.TOGGLE
          ? colorOptions[option].name
          : null
      return label || capitalize(option)
    },
    [colorOptions, type]
  )

  const handleChange = useCallback(
    (value, colorOutputs) => {
      const option = colorPickerProps.key
      const pathTail =
        option === 'null' // Updating fallback color?
          ? ['fallback', 'color']
          : ['options', option, 'color']
      handleChangeRaw(value, colorOutputs, pathTail)
    },
    [handleChangeRaw, colorPickerProps.key]
  )
  return (
    <>
      <OverflowText
        sx={styles.marqueeRoot}
        marqueeProps={{ play: !showColorPicker }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {Object.entries(colorOptions).map(([option, { color: value }]) => (
            <WithEditColorBadge
              key={option}
              // anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              showBadge={showColorPicker && option === colorPickerProps.key}
            >
              <RippleBox
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
            </WithEditColorBadge>
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

const ColorLegend = ({
  group,
  valueRange,
  colorBy,
  colorByOptions,
  featureTypeProps,
  anyNullValue,
  groupCalcValue,
  onSelectProp,
  onSelectGroupCalc,
  onChangePropAttr,
  onChangeColor,
}) => {
  const legendNumberFormatFunc = useSelector(selectLegendNumberFormatFunc)
  const colorByProp = featureTypeProps[colorBy]
  const numberFormat = legendNumberFormatFunc(colorByProp)
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
          <FormControl fullWidth>
            <InputLabel id="color-by-label">Color by</InputLabel>
            <Select
              id="color-by"
              labelId="color-by-label"
              label="Color by"
              value={colorBy}
              optionsList={colorByOptions}
              getLabel={(prop) => featureTypeProps[prop].name || prop}
              onSelect={onSelectProp(
                'colorBy',
                'groupCalcByColor',
                groupCalcValue
              )}
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
          {...{ colorByProp, anyNullValue, onChangeColor }}
        />
      ) : (
        <>
          <NumericalColorLegend
            {...{
              group,
              valueRange,
              numberFormat,
              anyNullValue,
              onChangeColor,
            }}
            onChangeValueAt={(index) =>
              onChangePropAttr([colorBy, 'gradient', 'data', index, 'value'])
            }
          />
          <ScaleSelector
            scale={valueRange.gradient.scale}
            scaleParams={valueRange.gradient.scaleParams}
            minDomainValue={valueRange.min}
            onSelect={onChangePropAttr([colorBy, 'gradient', 'scale'])}
            onChangeScaleParamById={(scaleParamId) =>
              onChangePropAttr([
                colorBy,
                'gradient',
                'scaleParams',
                scaleParamId,
              ])
            }
          />
        </>
      )}
      {group && (
        <GroupCalcSelector
          type={colorByProp.type}
          value={groupCalcValue}
          onSelect={onSelectGroupCalc('groupCalcByColor')}
        />
      )}
    </Paper>
  )
}

export default memo(ColorLegend)
