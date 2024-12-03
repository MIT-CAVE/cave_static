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
import { memo, useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  getMaxLabel,
  getMinLabel,
  GroupCalcSelector,
  PropIcon,
  ScaleSelector,
  WithEditBadge,
} from './Legend'

import { selectNumberFormatPropsFn } from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import SizeSlider, { useSizeSlider } from '../../compound/SizeSlider'

import { OverflowText, Select } from '../../compound'

import { orderEntireDict, parseGradient } from '../../../utils'

const styles = {
  legendSection: {
    height: '100%',
    width: '100%',
    p: 1,
    pt: 2,
    border: '1px outset rgb(128, 128, 128)',
    // justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  categoryRoot: {
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
    border: '1px solid rgb(128, 128, 128)',
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
}) => {
  const leftSz = useSizeSlider(onChangeSize)
  const rightSz = useSizeSlider(onChangeSize)
  const [activeThumb, setActiveThumb] = useState()

  const currentIndex = 0

  const { sizes, values, labels } = useMemo(
    () => parseGradient('sizeGradient', 'size')(valueRange),
    [valueRange]
  )

  const minLabel = useMemo(
    () => getMinLabel(labels, values, numberFormat, group, 'sizeGradient'),
    [group, labels, numberFormat, values]
  )

  const maxLabel = useMemo(
    () => getMaxLabel(labels, values, numberFormat, group, 'sizeGradient'),
    [group, labels, numberFormat, values]
  )

  const handleChange = useCallback(
    (event, value, thumb) => {
      setActiveThumb(thumb)
      // Only dispatch the change for the modified value
      const thumbChangeTrigger =
        leftSz.showSizeSlider && thumb === 0
          ? leftSz.handleChange
          : rightSz.showSizeSlider && (!leftSz.showSizeSlider || thumb === 1)
            ? rightSz.handleChange
            : () => {
                console.error('This should never happen...')
              }
      thumbChangeTrigger(event, [value[thumb]])
    },
    [
      leftSz.handleChange,
      leftSz.showSizeSlider,
      rightSz.handleChange,
      rightSz.showSizeSlider,
    ]
  )

  const handleChangeComitted = useCallback(
    (event, value) => {
      let index, thumbChangeComittedTrigger
      if (leftSz.showSizeSlider && activeThumb === 0) {
        thumbChangeComittedTrigger = leftSz.handleChangeComitted
        index = leftSz.sizeSliderProps.key
      } else if (
        rightSz.showSizeSlider &&
        (!leftSz.showSizeSlider || activeThumb === 1)
      ) {
        thumbChangeComittedTrigger = rightSz.handleChangeComitted
        index = rightSz.sizeSliderProps.key
      } else {
        console.error('This should never happen...')
      }

      const pathTail =
        index == null // Updating fallback size?
          ? ['fallback', 'size']
          : ['sizeGradient', 'data', index, 'size']
      thumbChangeComittedTrigger(event, value, pathTail)
    },
    [
      leftSz.showSizeSlider,
      leftSz.handleChangeComitted,
      leftSz.sizeSliderProps.key,
      activeThumb,
      rightSz.showSizeSlider,
      rightSz.handleChangeComitted,
      rightSz.sizeSliderProps.key,
    ]
  )

  const handleClose = useCallback(
    (event) => {
      leftSz.handleClose(event)
      rightSz.handleClose(event)
    },
    [rightSz, leftSz]
  )

  const showSizeSlider = leftSz.showSizeSlider || rightSz.showSizeSlider
  return (
    <>
      <Grid2 container spacing={0.5} sx={styles.rangeRoot}>
        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">Min</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
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
              <WithEditBadge editing={leftSz.showSizeSlider}>
                <PropIcon
                  {...{ icon }}
                  selected={leftSz.showSizeSlider}
                  size={leftSz.sizeSliderProps.value ?? sizes[currentIndex]}
                  onClick={leftSz.handleOpen(currentIndex, sizes[currentIndex])}
                />
              </WithEditBadge>
            )}
          </Grid2>
          <Grid2 size={6}>
            {icon && (
              <WithEditBadge editing={rightSz.showSizeSlider}>
                <PropIcon
                  {...{ icon }}
                  selected={rightSz.showSizeSlider}
                  size={
                    rightSz.sizeSliderProps.value ?? sizes[currentIndex + 1]
                  }
                  onClick={rightSz.handleOpen(
                    currentIndex + 1,
                    sizes[currentIndex + 1]
                  )}
                />
              </WithEditBadge>
            )}
          </Grid2>
        </Grid2>

        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">Max</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={maxLabel} />
          </Typography>
        </Grid2>
      </Grid2>

      {showSizeSlider && (
        <SizeSlider
          value={[
            ...(leftSz.sizeSliderProps.value != null
              ? leftSz.sizeSliderProps.value
              : []),
            ...(rightSz.sizeSliderProps.value != null
              ? rightSz.sizeSliderProps.value
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
  sizeByProp,
  icon,
  anyNullValue,
  onChangeSize,
}) => {
  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    // handleClose,
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
        sx={styles.categoryRoot}
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
          sizeLabel={getCategoryLabel(sizeSliderProps.key)}
          value={sizeSliderProps.value}
          // onClose={handleClose}
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
