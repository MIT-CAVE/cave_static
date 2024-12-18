import {
  capitalize,
  FormControl,
  Grid2,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useMemo } from 'react'
import { PiDotsThree } from 'react-icons/pi'
import { useSelector } from 'react-redux'

import {
  GroupCalcSelector,
  PropIcon,
  ScaleSelector,
  useGradientLabels,
  WithEditBadge,
} from './Legend'

import { selectNumberFormatPropsFn } from '../../../data/selectors'
import { propId, scaleId } from '../../../utils/enums'
import SizeSlider, { useSizeSlider } from '../../compound/SizeSlider'

import { NumberInput, OverflowText, Select } from '../../compound'

import { orderEntireDict, parseGradient } from '../../../utils'

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

  const { sizes, values, labels } = useMemo(
    () => parseGradient('sizeGradient', 'size')(valueRange),
    [valueRange]
  )

  const {
    getLabel,
    // getAttrLabelAt: getSizeLabelAt,
    getValueLabelAt,
  } = useGradientLabels({
    labels,
    values,
    numberFormat,
    group,
    isStepScale: valueRange.sizeGradient?.scale === scaleId.STEP,
    gradientKey: 'sizeGradient',
  })

  const handleChangeComittedAt = useCallback(
    (index) => (event, value) => {
      const pathTail =
        index == null // Updating fallback size?
          ? ['fallback', 'size']
          : ['sizeGradient', 'data', index, 'size']
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
          sx={styles.rangeRoot}
          divider={<PiDotsThree size={24} />}
        >
          {sizes.map((value, index) => (
            <Stack
              key={index}
              spacing={0.5}
              sx={{ alignSelf: 'end', alignItems: 'center' }}
            >
              {icon && (
                <WithEditBadge
                  editing={showSizeSlider && sizeSliderProps.key === index}
                >
                  <PropIcon
                    {...{ icon }}
                    selected={sizeSliderProps.key === index}
                    size={value}
                    onClick={handleOpen(index, sizes[index])}
                  />
                </WithEditBadge>
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                <OverflowText text={getLabel(index)} />
              </Typography>
            </Stack>
          ))}
        </Stack>
      </OverflowText>

      {showSizeSlider && (
        <Stack>
          <SizeSlider
            value={sizeSliderProps.value}
            onClose={handleClose}
            onChange={handleChange}
            onChangeCommitted={handleChangeComittedAt(sizeSliderProps.key)}
          />
          <NumberInput
            color="warning"
            sx={{
              width: 'auto',
              mt: '20px !important',
              flex: '1 1 auto',
              fieldset: {
                borderWidth: '2px !important',
              },
            }}
            slotProps={{
              input: {
                sx: { borderRadius: 0, pr: 1.75 },
              },
            }}
            label={getValueLabelAt(sizeSliderProps.key)}
            min={valueRange.min}
            max={valueRange.max}
            value={values[sizeSliderProps.key]}
            {...{ numberFormat }}
            onClickAway={onChangeValueAt(sizeSliderProps.key)}
          />
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
          styleOverrides={{ marginBottom: '32px' }}
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
  onSelectGroupCalc,
  onChangePropAttr,
  onChangeSize,
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
            onChangeValueAt={(index) =>
              onChangePropAttr([sizeBy, 'sizeGradient', 'data', index, 'value'])
            }
          />
          <ScaleSelector
            scale={valueRange.sizeGradient.scale}
            scaleParams={valueRange.sizeGradient.scaleParams}
            minDomainValue={valueRange.min}
            onSelect={onChangePropAttr([sizeBy, 'sizeGradient', 'scale'])}
            onChangeScaleParamById={(scaleParamId) =>
              onChangePropAttr([
                sizeBy,
                'sizeGradient',
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
          onSelect={onSelectGroupCalc('groupCalcBySize')}
        />
      )}
    </Paper>
  )
}

export default memo(SizeLegend)
