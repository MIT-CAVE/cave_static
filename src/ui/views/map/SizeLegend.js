import {
  capitalize,
  FormControl,
  Grid2,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { memo, useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  getMaxLabel,
  getMinLabel,
  GroupCalcSelector,
  PropIcon,
  WithEditBadge,
} from './Legend'

import { selectNumberFormatPropsFn } from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import SizeSlider, { useSizeSlider } from '../../compound/SizeSlider'

import { OverflowText, Select } from '../../compound'

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

  // const handleClose = useCallback(
  //   (event) => {
  //     minSz.handleClose(event)
  //     maxSz.handleClose(event)
  //   },
  //   [maxSz, minSz]
  // )

  const showSizeSlider = minSz.showSizeSlider || maxSz.showSizeSlider
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
              <WithEditBadge editing={minSz.showSizeSlider}>
                <PropIcon
                  {...{ icon }}
                  selected={minSz.showSizeSlider}
                  size={minSz.sizeSliderProps.value ?? startSize}
                  onClick={minSz.handleOpen('startSize', startSize)}
                />
              </WithEditBadge>
            )}
          </Grid2>
          <Grid2 size={6}>
            {icon && (
              <WithEditBadge editing={maxSz.showSizeSlider}>
                <PropIcon
                  {...{ icon }}
                  selected={maxSz.showSizeSlider}
                  size={maxSz.sizeSliderProps.value ?? endSize}
                  onClick={maxSz.handleOpen('endSize', endSize)}
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
            ...(minSz.sizeSliderProps.value != null
              ? minSz.sizeSliderProps.value
              : []),
            ...(maxSz.sizeSliderProps.value != null
              ? maxSz.sizeSliderProps.value
              : []),
          ]}
          // onClose={handleClose}
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
  sizeByOptions,
  featureTypeProps,
  icon,
  onChangeSize,
}) => {
  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    // handleClose,
    handleChange,
    handleChangeComitted,
  } = useSizeSlider(onChangeSize)

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
  const sizeOptions = sizeByOptions[sizeBy]
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
  sizeByOptions,
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
  const optionsList = useMemo(() => Object.keys(sizeByOptions), [sizeByOptions])
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
              {...{ optionsList }}
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
          {...{ sizeBy, sizeByOptions, featureTypeProps, icon, onChangeSize }}
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
          onSelect={onSelectGroupCalc('groupCalcBySize')}
        />
      )}
    </Paper>
  )
}

export default memo(SizeLegend)
