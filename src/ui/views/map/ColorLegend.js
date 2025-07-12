import {
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  MdClose,
  MdMoreVert,
  // MdOutlineSwapVert,
} from 'react-icons/md'
import { TbFocusAuto, TbRowInsertBottom, TbRowInsertTop } from 'react-icons/tb'
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
import { useMenu } from '../../../utils/hooks'
import { getScaledValueAlt } from '../../../utils/scales'
import ColorPicker, { useColorPicker } from '../../compound/ColorPicker'

import { NumberInput, OverflowText, Select, TextInput } from '../../compound'

import {
  capitalize,
  getChartItemColor,
  getContrastText,
  orderEntireDict,
  parseGradient,
} from '../../../utils'

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

const ToggleMenuItem = ({ disabled, label, value, onClick }) => (
  <MenuItem {...{ disabled }}>
    <FormControlLabel
      {...{ label }}
      slotProps={{ typography: { variant: 'body2' } }}
      control={
        <Switch
          sx={{ mr: 1 }}
          size="small"
          checked={value}
          onChange={onClick}
        />
      }
    />
  </MenuItem>
)

const BaseMenuItem = ({ disabled, label, reactIcon: ReactIcon, onClick }) => (
  <MenuItem {...{ disabled, onClick }}>
    <ListItemIcon>
      <ReactIcon size={20} />
    </ListItemIcon>
    <ListItemText slotProps={{ primary: { variant: 'body2' } }}>
      {label}
    </ListItemText>
  </MenuItem>
)

const ColorMenu = ({
  index,
  dataIndices,
  editLabelAt,
  onAddColorAt,
  onRemoveColorAt,
  onToggleEditLabelAt,
}) => {
  const [menuIndex, setMenuIndex] = useState(null)

  const {
    anchorEl,
    handleOpenMenu: handleOpenMenuRaw,
    handleCloseMenu: handleCloseMenuRaw,
  } = useMenu()

  const handleOpenMenu = useCallback(
    (index) => (event) => {
      handleOpenMenuRaw(event)
      setMenuIndex(index)
    },
    [handleOpenMenuRaw]
  )

  const handleCloseMenu = useCallback(
    (event) => {
      handleCloseMenuRaw(event)
      setMenuIndex(null)
    },
    [handleCloseMenuRaw]
  )

  const dataIndex = dataIndices[index]
  return (
    <div>
      <ToggleButton
        sx={{
          p: '1px',
          mt: '20px !important',
          borderRadius: '50%',
        }}
        color="warning"
        value="color-menu"
        selected={index === menuIndex}
        onClick={handleOpenMenu(index)}
      >
        <MdMoreVert size={18} />
      </ToggleButton>
      <Menu
        {...{ anchorEl }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        slotProps={{ paper: { sx: { width: '21.5ch' } } }}
        sx={{ p: 0 }}
      >
        <BaseMenuItem
          label="Add Color Above"
          reactIcon={TbRowInsertTop}
          onClick={(event) => {
            onAddColorAt(dataIndex)()
            handleCloseMenu(event)
          }}
        />
        <BaseMenuItem
          label="Add Color Below"
          reactIcon={TbRowInsertBottom}
          onClick={(event) => {
            onAddColorAt(dataIndex + 1)()
            handleCloseMenu(event)
          }}
        />
        <Divider />
        <ToggleMenuItem
          label="Edit Label"
          onClick={onToggleEditLabelAt(dataIndex)}
          value={editLabelAt[dataIndex]}
        />
        <Divider />
        <BaseMenuItem
          disabled={dataIndices.length < 3}
          label="Remove Color"
          reactIcon={MdClose}
          onClick={(event) => {
            onRemoveColorAt(dataIndex)()
            handleCloseMenu(event)
          }}
        />
      </Menu>
    </div>
  )
}

const NumericalColorLegend = ({
  group,
  valueRange,
  numberFormat,
  // anyNullValue, // TODO: Implement `fallback` UI
  onAddColorAt,
  onChangeColor,
  onChangeLabelAt,
  onRemoveColorAt,
  onChangeValueAt,
}) => {
  const [editLabelAt, setEditLabelAt] = useState({})
  const { colors, values, rawValues, labels, dataIndices } = useMemo(
    () => parseGradient('color', numberFormat.precision)(valueRange),
    [numberFormat.precision, valueRange]
  )

  const {
    showColorPicker: showColorPickers,
    handleOpen,
    handleChange,
    handleClose,
  } = useColorPicker(onChangeColor)

  const {
    isStepScale,
    lastIndex,
    minAuto,
    maxAuto,
    getLabel,
    getAttrLabelAt,
    getAdjustedLabel,
    getValueLabelAt,
    handleSetAutoValueAt,
    // handleSwapColorsAt,
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
    (dataIndex) => (value, colorOutputs) => {
      const pathTail =
        dataIndex == null // Updating fallback color?
          ? ['fallback', 'color']
          : ['gradient', 'data', dataIndex, 'color']
      handleChange(value, colorOutputs, pathTail)
    },
    [handleChange]
  )

  const handleToggleEditLabelAt = useCallback(
    (dataIndex) => () => {
      setEditLabelAt((oldValue) => ({
        ...oldValue,
        [dataIndex]: !oldValue[dataIndex],
      }))
    },
    []
  )

  return (
    <>
      <Grid container spacing={1.5} sx={styles.rangeRoot} wrap="nowrap">
        <Grid size={3} sx={styles.rangeLabel}>
          <Typography variant="caption" noWrap>
            <OverflowText text={getAdjustedLabel('Min', 0)} />
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={getLabel(0)} />
          </Typography>
        </Grid>
        <Grid size="grow">
          <WithEditColorBadge showBadge={showColorPickers}>
            <RippleBox
              selected={showColorPickers}
              sx={gradientStyle}
              onClick={handleOpen(null, null)}
            />
          </WithEditColorBadge>
        </Grid>
        <Grid size={3} sx={styles.rangeLabel}>
          <Typography variant="caption">
            <OverflowText text={getAdjustedLabel('Max', lastIndex)} />
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            <OverflowText text={getLabel(lastIndex)} />
          </Typography>
        </Grid>
      </Grid>
      {showColorPickers && (
        <Stack spacing={1} style={{ marginTop: 0 }}>
          {rawValues.map((value, index) => {
            const dataIndex = dataIndices[index]
            /* <div key={index} style={{ position: 'relative' }}>

          {index > 0 && (
            <RippleBox
            sx={{
                  zIndex: 1,
                  position: 'absolute',
                  top: '-5px',
                  right: '20px',
                  width: 'fit-content',
                  p: '1px',
                  border: '2px outset #ffa726',
                  borderRadius: '50%',
                  }}
                onClick={handleSwapColorsAt(dataIndex)}
              >
                <MdOutlineSwapVert size={16} />
              </RippleBox>
            )} */
            const isLabelEmpty = labels[index] == null || labels[index] === ''
            const isLastStepScaleItem = isStepScale && index === lastIndex
            return (
              <Grid
                key={index}
                container
                spacing={1}
                sx={{ alignItems: 'center' }}
              >
                <Grid container spacing={1} size="grow">
                  {
                    // Do not display the max value for a step function
                    // scale, as it does not affect the function output
                    !isLastStepScaleItem && (
                      <Grid size={6}>
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
                            (index === lastIndex &&
                              lastIndex > 0 &&
                              !maxAuto) ? (
                              <IconButton
                                size="small"
                                onClick={handleSetAutoValueAt(dataIndex, index)}
                              >
                                <TbFocusAuto />
                              </IconButton>
                            ) : null
                          }
                          label={getValueLabelAt(index)}
                          {...{ value, numberFormat }}
                          onClickAway={onChangeValueAt(dataIndex)}
                        />
                      </Grid>
                    )
                  }
                  <Grid size={isLastStepScaleItem ? 12 : 6}>
                    <ColorPicker
                      colorLabel={getAttrLabelAt(index)}
                      value={colors[index]}
                      onChange={handleChangeColorAt(dataIndex)}
                      onClose={handleClose}
                    />
                  </Grid>
                  {editLabelAt[dataIndex] && (
                    <Grid size={12} sx={{ mt: 1 }}>
                      <TextInput
                        color="warning"
                        label={`Label${isLabelEmpty ? ` \u279D ${getAttrLabelAt(index)}` : ''}`}
                        value={labels[index]}
                        onClickAway={onChangeLabelAt(dataIndex)}
                      ></TextInput>
                    </Grid>
                  )}
                </Grid>
                <Grid size="auto">
                  <ColorMenu
                    {...{
                      index,
                      dataIndices,
                      editLabelAt,
                      onAddColorAt,
                      onRemoveColorAt,
                    }}
                    onToggleEditLabelAt={handleToggleEditLabelAt}
                  />
                </Grid>
              </Grid>
              // </div>
            )
          })}
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
          color: (d) => R.propOr(getChartItemColor(d['name']), 'color', d), // In case `color` is missing
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
  onChangeLegendAttr,
  onChangePropAttr,
  onChangeColor,
}) => {
  const legendNumberFormatFunc = useSelector(selectLegendNumberFormatFunc)
  const colorByProp = featureTypeProps[colorBy]
  const numberFormat = legendNumberFormatFunc(colorByProp)
  const isCategorical = colorByProp.type !== propId.NUMBER

  const handleAddColorAt = useCallback(
    (dataIndex) => () => {
      const newItem = {
        value: 0, // FIXME: Use getScaledValueAlt
        color: '#fff', // FIXME: Use getScaledValueAlt
      }
      const newGradientData = R.insert(
        dataIndex,
        newItem
      )(valueRange.gradient.data)
      onChangePropAttr([colorBy, 'gradient', 'data'])(newGradientData)
    },
    [colorBy, onChangePropAttr, valueRange.gradient?.data]
  )

  const handleRemoveColorAt = useCallback(
    (dataIndex) => () => {
      const gradientItem = valueRange.gradient.data[dataIndex]
      if ('size' in gradientItem) {
        const newItem = R.dissoc('color')(gradientItem)
        onChangePropAttr([colorBy, 'gradient', 'data', dataIndex])(newItem)
      } else {
        // Remove the entire gradient item for orphan entries (no `size` or `color`)
        const newGradientData = R.remove(dataIndex, 1)(valueRange.gradient.data)
        onChangePropAttr([colorBy, 'gradient', 'data'])(newGradientData)
      }
    },
    [colorBy, onChangePropAttr, valueRange.gradient?.data]
  )

  return (
    <Paper
      elevation={3}
      component={Stack}
      spacing={2}
      sx={styles.legendSection}
    >
      <Grid container spacing={1}>
        <Grid size="grow">
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
            onChangeValueAt={(dataIndex) =>
              onChangePropAttr([
                colorBy,
                'gradient',
                'data',
                dataIndex,
                'value',
              ])
            }
            onChangeLabelAt={(dataIndex) =>
              onChangePropAttr([
                colorBy,
                'gradient',
                'data',
                dataIndex,
                'label',
              ])
            }
            onAddColorAt={handleAddColorAt}
            onRemoveColorAt={handleRemoveColorAt}
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
          onSelect={onChangeLegendAttr('groupCalcByColor')}
        />
      )}
    </Paper>
  )
}

export default memo(ColorLegend)
