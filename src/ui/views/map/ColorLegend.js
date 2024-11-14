import {
  capitalize,
  FormControl,
  Grid2,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { memo, useCallback } from 'react'
import { useSelector } from 'react-redux'

import {
  getMaxLabel,
  getMinLabel,
  GroupCalcSelector,
  RippleBox,
  WithEditBadge,
} from './Legend'

import { selectNumberFormatPropsFn } from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import ColorPicker, { useColorPicker } from '../../compound/ColorPicker'

import { OverflowText, Select } from '../../compound'

import { getContrastText } from '../../../utils'

const styles = {
  legendSection: {
    height: '100%',
    width: '100%',
    p: 1,
    pt: 2,
    boxSizing: 'border-box',
  },
  categoryRoot: {
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
    border: 1,
    px: 1,
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
  },
  gradientRoot: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    m: 1,
  },
  rangeLabel: {
    textAlign: 'center',
    maxWidth: '56px',
  },
  getGradient: (minColor, maxColor) => ({
    width: '100%',
    height: '24px',
    minWidth: '80px',
    backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
  }),
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

  // const handleClose = useCallback(
  //   (event) => {
  //     minCp.handleClose(event)
  //     maxCp.handleClose(event)
  //   },
  //   [maxCp, minCp]
  // )

  const showColorPicker = minCp.showColorPicker && maxCp.showColorPicker
  return (
    <>
      <Grid2 container spacing={1.5} sx={styles.gradientRoot}>
        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">Min</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={minLabel} />
          </Typography>
        </Grid2>
        <Grid2 size="grow">
          <WithEditColorBadge showBadge={showColorPicker}>
            <RippleBox
              selected={showColorPicker}
              sx={styles.getGradient(startGradientColor, endGradientColor)}
              onClick={handleClick}
            />
          </WithEditColorBadge>
        </Grid2>
        <Grid2 size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">Max</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
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
            // onClose={handleClose}
          />
          <ColorPicker
            colorLabel="Max"
            value={maxCp.colorPickerProps.value}
            onChange={maxCp.handleChange}
            // onClose={handleClose}
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
        sx={styles.categoryRoot}
        marqueeProps={{ play: !showColorPicker }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {Object.entries(colorOptions).map(([option, value]) => (
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
          <FormControl fullWidth>
            <InputLabel id="color-by-label">Color by</InputLabel>
            <Select
              id="color-by"
              labelId="color-by-label"
              label="Color by"
              value={colorBy}
              optionsList={Object.keys(colorByOptions)}
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
          {...{ colorBy, colorByOptions, featureTypeProps, onChangeColor }}
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
          onSelect={onSelectGroupCalc('groupCalcByColor')}
        />
      )}
    </Paper>
  )
}

export default memo(ColorLegend)
