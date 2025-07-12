import {
  FormControl,
  Grid,
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
  PropIcon,
  ScaleSelector,
  useGradient,
  WithEditBadge,
} from './Legend'

import { selectLegendNumberFormatFunc } from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import SizeSlider, { useSizeSlider } from '../../compound/SizeSlider'

import { NumberInput, OverflowText, Select } from '../../compound'

import { capitalize, orderEntireDict, parseGradient } from '../../../utils'

const styles = {
  legendSection: {
    height: '100%',
    width: '100%',
    p: 1,
    pt: 2,
    border: '1px outset rgb(128 128 128)',
    // justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  marqueRoot: {
    height: '100%',
    width: '100%',
    pt: 0.75,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeLabel: {
    textAlign: 'center',
    maxWidth: '56px',
  },
  valueInput: {
    mt: '20px !important',
    flex: '1 1 auto',
    fieldset: {
      borderWidth: '2px !important',
    },
  },
}

const NumericalSizeLegend = ({
  icon,
  group,
  valueRange,
  numberFormat,
  // anyNullValue, // TODO: Implement `fallback` UI
  onChangeSize,
  onChangeValueAt,
}) => {
  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    handleClose,
    handleChange,
    handleChangeComitted: handleChangeComittedRaw,
  } = useSizeSlider(onChangeSize)

  const { sizes, values, rawValues, labels, dataIndices } = useMemo(
    () => parseGradient('size', numberFormat.precision)(valueRange),
    [numberFormat.precision, valueRange]
  )

  const {
    isStepScale,
    lastIndex,
    minAuto,
    maxAuto,
    getLabel,
    getAdjustedLabel,
    getAttrLabelAt: getSizeLabelAt,
    getValueLabelAt,
    getFormattedValueAt,
    handleSetAutoValueAt,
  } = useGradient({
    labels,
    values,
    rawValues,
    dataIndices,
    gradient: valueRange.gradient,
    numberFormat,
    group,
    onChangeValueAt,
  })

  const handleChangeComittedAt = useCallback(
    (dataIndex) => (event, value) => {
      const pathTail =
        dataIndex == null // Updating fallback size?
          ? ['fallback', 'size']
          : ['gradient', 'data', dataIndex, 'size']
      handleChangeComittedRaw(event, value, pathTail)
    },
    [handleChangeComittedRaw]
  )

  return (
    <>
      <OverflowText
        sx={styles.marqueRoot}
        marqueeProps={{ play: !showSizeSlider }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={
            isStepScale
              ? { justifyContent: 'center', alignItems: 'end' }
              : styles.rangeRoot
          }
          divider={
            !isStepScale && (
              <Typography variant="h6" sx={{ pb: 7 }}>{`\u2026`}</Typography>
            )
          }
        >
          {sizes.map((value, index) => {
            const selected = sizeSliderProps.key === index
            return (
              <Stack
                key={index}
                spacing={0.5}
                sx={[
                  { alignItems: 'center' },
                  !isStepScale && { alignSelf: 'stretch' },
                ]}
              >
                {icon && (
                  <WithEditBadge
                    editing={showSizeSlider && selected}
                    sx={
                      !isStepScale && { flex: '1 1 auto', alignItems: 'center' }
                    }
                  >
                    <PropIcon
                      {...{ icon, selected }}
                      size={value}
                      onClick={handleOpen(index, sizes[index])}
                    />
                  </WithEditBadge>
                )}
                <Stack>
                  {!isStepScale && (
                    <Typography
                      variant="caption"
                      color={selected ? 'warning' : 'default'}
                      noWrap
                    >
                      <OverflowText
                        text={getAdjustedLabel(
                          index < 1
                            ? 'Min'
                            : index === lastIndex
                              ? 'Max'
                              : labels[index] != null
                                ? getLabel(index)
                                : `\u2063`, // This preserves the alignment of the icons
                          index
                        )}
                      />
                    </Typography>
                  )}
                  <Typography
                    variant="subtitle2"
                    color={selected ? 'warning' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    <OverflowText
                      text={
                        isStepScale
                          ? getSizeLabelAt(index)
                          : labels[index] != null
                            ? getFormattedValueAt(index)
                            : getLabel(index)
                      }
                    />
                  </Typography>
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </OverflowText>

      {showSizeSlider && (
        <Stack useFlexGap>
          <SizeSlider
            value={sizeSliderProps.value}
            onClose={handleClose}
            onChange={handleChange}
            onChangeCommitted={handleChangeComittedAt(
              dataIndices[sizeSliderProps.key]
            )}
          />
          {
            // Do not display the max value for a step function
            // scale, as it does not affect the function output
            !(isStepScale && sizeSliderProps.key === lastIndex) && (
              <NumberInput
                color="warning"
                sx={styles.valueInput}
                slotProps={{
                  input: {
                    sx: { borderRadius: 0, pr: 1.75 },
                  },
                }}
                // Show the auto-min/max button when the min/max value is custom
                endAdornments={
                  (sizeSliderProps.key < 1 && !minAuto) ||
                  (sizeSliderProps.key === lastIndex && !maxAuto) ? (
                    <IconButton
                      size="small"
                      onClick={handleSetAutoValueAt(
                        dataIndices[sizeSliderProps.key],
                        sizeSliderProps.key
                      )}
                    >
                      <TbFocusAuto />
                    </IconButton>
                  ) : null
                }
                label={getValueLabelAt(sizeSliderProps.key)}
                value={rawValues[sizeSliderProps.key]}
                {...{ numberFormat }}
                onClickAway={onChangeValueAt(dataIndices[sizeSliderProps.key])}
              />
            )
          }
        </Stack>
      )}
    </>
  )
}

const CategoricalSizeLegend = ({
  type,
  sizeByProp,
  icon,
  anyNullValue,
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

  const sizeOptions = useMemo(() => {
    const { options, fallback } = sizeByProp
    return R.pipe(
      orderEntireDict, // Preserve order of options after state updates
      // Add fallback size for null values, if available
      R.when(
        R.always(anyNullValue && fallback?.size != null),
        R.assoc('null', fallback)
      ),
      R.map(
        R.applySpec({
          name: R.prop('name'),
          size: R.propOr('1px', 'size'), // In case `size` is missing
          // Think more about this: unspecified `size`s
        })
      )
    )(options)
  }, [anyNullValue, sizeByProp])

  const getCategoryLabel = useCallback(
    (option) => {
      const label =
        type === propId.SELECTOR || type === propId.TOGGLE
          ? sizeOptions[option].name
          : null
      return label || capitalize(option)
    },
    [sizeOptions, type]
  )

  const handleChangeComitted = useCallback(
    (event, value) => {
      const option = sizeSliderProps.key
      const path =
        option === 'null' // Updating fallback size?
          ? ['fallback', 'size']
          : ['options', option, 'size']
      handleChangeComittedRaw(event, value, path)
    },
    [handleChangeComittedRaw, sizeSliderProps.key]
  )
  return (
    <>
      <OverflowText
        sx={styles.marqueRoot}
        marqueeProps={{ play: !showSizeSlider }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'center', alignItems: 'end' }}
        >
          {Object.entries(sizeOptions).map(([option, { size: value }]) => (
            <Stack key={option} sx={{ alignItems: 'center' }}>
              <WithEditBadge
                editing={showSizeSlider && option === sizeSliderProps.key}
              >
                <PropIcon
                  {...{ icon }}
                  selected={option === sizeSliderProps.key}
                  size={value}
                  onClick={handleOpen(option, value)}
                />
              </WithEditBadge>
              <Typography variant="caption">
                {getCategoryLabel(option)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </OverflowText>
      {showSizeSlider && (
        <SizeSlider
          sx={{ mb: 4 }}
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
  anyNullValue,
  icon,
  group,
  sizeByOptions,
  groupCalcValue,
  onSelectProp,
  onChangeLegendAttr,
  onChangePropAttr,
  onChangeSize,
}) => {
  const legendNumberFormatFunc = useSelector(selectLegendNumberFormatFunc)
  const sizeByProp = featureTypeProps[sizeBy]
  const numberFormat = legendNumberFormatFunc(sizeByProp)
  const isCategorical = sizeByProp.type !== propId.NUMBER
  return (
    <Paper
      elevation={3}
      component={Stack}
      useFlexGap // TODO: Handle sizeSlider's `sx` prop
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid container spacing={1}>
        <Grid size="grow">
          <FormControl fullWidth>
            <InputLabel id="size-by-label">Size by</InputLabel>
            <Select
              id="size-by"
              labelId="size-by-label"
              label="Size by"
              value={sizeBy}
              optionsList={sizeByOptions}
              getLabel={(option) => featureTypeProps[option].name || option}
              onSelect={onSelectProp(
                'sizeBy',
                'groupCalcBySize',
                groupCalcValue
              )}
            />
          </FormControl>
        </Grid>
        {numberFormat.unit && (
          <Grid size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit} />
            </Typography>
          </Grid>
        )}
      </Grid>
      {isCategorical ? (
        <CategoricalSizeLegend
          type={sizeByProp.type}
          {...{ icon, sizeByProp, anyNullValue, onChangeSize }}
        />
      ) : (
        <>
          <NumericalSizeLegend
            {...{
              valueRange,
              numberFormat,
              icon,
              group,
              anyNullValue,
              onChangeSize,
            }}
            onChangeValueAt={(dataIndex) =>
              onChangePropAttr([sizeBy, 'gradient', 'data', dataIndex, 'value'])
            }
          />
          <ScaleSelector
            scale={valueRange.gradient.scale}
            scaleParams={valueRange.gradient.scaleParams}
            minDomainValue={valueRange.min}
            onSelect={onChangePropAttr([sizeBy, 'gradient', 'scale'])}
            onChangeScaleParamById={(scaleParamId) =>
              onChangePropAttr([
                sizeBy,
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
          type={sizeByProp.type}
          value={groupCalcValue}
          onSelect={onChangeLegendAttr('groupCalcBySize')}
        />
      )}
    </Paper>
  )
}

export default memo(SizeLegend)
