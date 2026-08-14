import {
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
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
  ScaleSelector,
  useGradient,
  WithEditBadge,
} from './Legend'

import {
  selectLegendNumberFormatFunc,
  selectParsedGradient,
} from '../../../data/selectors'
import { propId, scaleId } from '../../../utils/enums'
import { useMenu } from '../../../utils/hooks'
import { getScaledValue } from '../../../utils/scales'
import ColorPicker, { useColorPicker } from '../../compound/ColorPicker'
import RippleBox from '../../compound/RippleBox'
import NumberField from '../../prototypes/NumberField'

import { OverflowText, Select, TextInput } from '../../compound'

import {
  capitalize,
  getChartItemColor,
  getContrastText,
  orderEntireDict,
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
  inputValue: {
    mt: '20px !important',
    flex: '1 1 auto',
    fieldset: {
      borderWidth: '2px !important',
      borderRadius: 0,
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
  const nextDataIndex = dataIndices[index + 1]

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
            onAddColorAt(nextDataIndex)()
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

const ColorEditSection = ({
  colorByProp,
  valueRange,
  numberFormat,
  lastIndex,
  isStepScale,
  minAuto,
  maxAuto,
  getAttrLabelAt,
  getValueLabelAt,
  onAddColorAt,
  onRemoveColorAt,
  onSetAutoValueAt,
  onChangeLabelAt,
  onChangeColorAt,
  onChangeValueAt,
  onClose,
}) => {
  const [editLabelAt, setEditLabelAt] = useState({})
  const parsedGradient = useSelector((state) =>
    selectParsedGradient(state, 'color', colorByProp, valueRange)
  )
  const { colors, rawValues, labels, dataIndices } = parsedGradient
  const [itemsOrder, setItemsOrder] = useState(R.range(0, dataIndices.length))
  const [values, setValues] = useState(rawValues)

  const handleToggleEditLabelAt = useCallback(
    (dataIndex) => () => {
      setEditLabelAt((oldValue) => ({
        ...oldValue,
        [dataIndex]: !oldValue[dataIndex],
      }))
    },
    []
  )

  const handleAddColorAt = useCallback(
    (dataIndex) => {
      const index = dataIndices.indexOf(dataIndex)
      setItemsOrder(R.insert(index, dataIndices.length))
      setValues(R.insert(index, 0)) // FIXME: Move new gradient value logic here
      return onAddColorAt(dataIndex)
    },
    [dataIndices, onAddColorAt]
  )

  const handleRemoveColorAt = useCallback(
    (dataIndex) => {
      const index = dataIndices.indexOf(dataIndex)
      setItemsOrder((currentItemsOrder) =>
        R.pipe(
          R.remove(index, 1),
          R.map(R.when(R.lt(currentItemsOrder[index]), R.dec))
        )(currentItemsOrder)
      )
      setValues(R.remove(index, 1))
      return onRemoveColorAt(dataIndex)
    },
    [dataIndices, onRemoveColorAt]
  )

  const handleSetAutoValueAt = useCallback(
    (dataIndex, index) => () => {
      const autoValue = index < 1 ? valueRange?.min : valueRange?.max
      setValues(R.update(index, autoValue))
      return onSetAutoValueAt(dataIndex, index)()
    },
    [onSetAutoValueAt, valueRange?.max, valueRange?.min]
  )

  return (
    <Stack spacing={1} style={{ marginTop: 0 }}>
      {dataIndices.map((rawDataIndex, rawIndex) => {
        const index = itemsOrder.indexOf(rawIndex)
        const dataIndex = dataIndices[index]
        if (index < 0) {
          console.error('This should not happen. Check these values:', {
            rawIndex,
            index,
            dataIndices,
          })
          return null
        }

        const value = values[index]
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
            key={rawIndex}
            container
            spacing={1}
            sx={{
              alignItems: 'center',
              // Make sure this component referred to by dataIndex is not re-rendered by
              // keeping it in the same DOM position while only changing the order in
              // which it appears.
              order: index,
            }}
          >
            <Grid container spacing={1} size="grow">
              {
                // Do not display the max value for a step function
                // scale, as it does not affect the function output
                !isLastStepScaleItem && (
                  // Using an uncontrolled `NumberField` for better performance
                  <Grid size={6}>
                    <NumberField
                      color="warning"
                      sx={styles.inputValue}
                      label={getValueLabelAt(index)}
                      {...{ value, numberFormat }}
                      onChange={(event, newValue) => {
                        setValues(R.update(index, newValue))
                      }}
                      onChangeCommitted={(event, newValue) => {
                        onChangeValueAt(dataIndex)(newValue)
                      }}
                      // Show auto min/max button if custom min/max values are set
                      endAdornments={
                        (index < 1 && !minAuto) ||
                        (index === lastIndex && lastIndex > 0 && !maxAuto) ? (
                          <IconButton
                            size="small"
                            onClick={handleSetAutoValueAt(dataIndex, index)}
                          >
                            <TbFocusAuto />
                          </IconButton>
                        ) : null
                      }
                    />
                  </Grid>
                )
              }
              <Grid size={isLastStepScaleItem ? 12 : 6}>
                <ColorPicker
                  colorLabel={getAttrLabelAt(index)}
                  value={colors[index]}
                  onChange={onChangeColorAt(dataIndex)}
                  {...{ onClose }}
                />
              </Grid>
              {editLabelAt[dataIndex] && (
                <Grid size={12} sx={{ mt: 1 }}>
                  <TextInput
                    color="warning"
                    label={`Label${isLabelEmpty ? ` \u279D ${getAttrLabelAt(index)}` : ''}`}
                    value={labels[index]}
                    onClickAway={onChangeLabelAt(dataIndex)}
                  />
                </Grid>
              )}
            </Grid>
            <Grid size="auto">
              <ColorMenu
                {...{ index, dataIndices, editLabelAt }}
                onAddColorAt={handleAddColorAt}
                onRemoveColorAt={handleRemoveColorAt}
                onToggleEditLabelAt={handleToggleEditLabelAt}
              />
            </Grid>
          </Grid>
          // </div>
        )
      })}
    </Stack>
  )
}

const NumericalColorLegend = ({
  group,
  colorBy,
  colorByProp,
  valueRange,
  numberFormat,
  // eslint-disable-next-line no-unused-vars
  anyNullValue, // TODO: Implement `fallback` UI
  colorPicker,
  onChangePropAttr,
}) => {
  const parsedGradient = useSelector((state) =>
    selectParsedGradient(state, 'color', colorByProp, valueRange)
  )
  const { colors, rawValues, values, labels, dataIndices } = parsedGradient
  const gradient = valueRange.gradient

  const handleAddColorAt = useCallback(
    (dataIndex) => () => {
      const scale = gradient.scale
      // eslint-disable-next-line no-unused-vars
      const scaleParams = gradient.scaleParams
      // eslint-disable-next-line no-unused-vars
      const isStepScale = scale === scaleId.STEP
      const newItem = {
        value: 0, // FIXME: Use getScaledValue
        color: '#fff', // FIXME: Use getScaledValue
      }

      // const newItem = {
      //   value: getScaledValue(
      //     [dataIndices[dataIndex - 1], dataIndices[dataIndex]],
      //     values,
      //     dataIndex,
      //     isStepScale ? scaleId.LINEAR : scale,
      //     scaleParams
      //   ),
      //   color: getScaledValue(
      //     dataIndices,
      //     colors,
      //     dataIndex,
      //     isStepScale ? scaleId.LINEAR : scale,
      //     scaleParams
      //   ),
      // }

      const newGradientData = R.insert(dataIndex, newItem)(gradient.data)
      onChangePropAttr([colorBy, 'gradient', 'data'])(newGradientData)
    },
    [
      colorBy,
      gradient?.data,
      gradient?.scale,
      gradient?.scaleParams,
      onChangePropAttr,
    ]
  )

  const handleRemoveColorAt = useCallback(
    (dataIndex) => () => {
      const gradientItem = gradient.data[dataIndex]
      if ('size' in gradientItem) {
        const newItem = R.dissoc('color')(gradientItem)
        onChangePropAttr([colorBy, 'gradient', 'data', dataIndex])(newItem)
      } else {
        // Remove the entire gradient item for orphan entries (neither `size` nor `color`)
        const newGradientData = R.remove(dataIndex, 1)(gradient.data)
        onChangePropAttr([colorBy, 'gradient', 'data'])(newGradientData)
      }
    },
    [colorBy, gradient?.data, onChangePropAttr]
  )

  const {
    showColorPicker: showColorPickers,
    handleOpen,
    handleChange,
    handleClose,
  } = colorPicker

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

  const handleChangeValueAt = useCallback(
    (dataIndex) =>
      onChangePropAttr([colorBy, 'gradient', 'data', dataIndex, 'value']),
    [colorBy, onChangePropAttr]
  )

  const handleChangeLabelAt = useCallback(
    (dataIndex) =>
      onChangePropAttr([colorBy, 'gradient', 'data', dataIndex, 'label']),
    [colorBy, onChangePropAttr]
  )

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
    gradient,
    numberFormat,
    group,
    onChangeValueAt: handleChangeValueAt,
  })

  const gradientStyle = useMemo(() => {
    const { scale, scaleParams } = valueRange.gradient
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    const scaledValues = R.map((value) =>
      getScaledValue(
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
        <ColorEditSection
          {...{
            colorByProp,
            valueRange,
            numberFormat,
            lastIndex,
            isStepScale,
            minAuto,
            maxAuto,
            getAttrLabelAt,
            getValueLabelAt,
          }}
          onSetAutoValueAt={handleSetAutoValueAt}
          onChangeValueAt={handleChangeValueAt}
          onChangeLabelAt={handleChangeLabelAt}
          onRemoveColorAt={handleRemoveColorAt}
          onAddColorAt={handleAddColorAt}
          onChangeColorAt={handleChangeColorAt}
          onClose={handleClose}
        />
      )}
    </>
  )
}

const CategoricalColorLegend = ({ colorByProp, colorPicker, anyNullValue }) => {
  const {
    colorPickerProps,
    showColorPicker,
    handleOpen,
    handleClose,
    handleChange: handleChangeRaw,
  } = colorPicker
  const type = colorByProp.type

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

  const colorPicker = useColorPicker(onChangeColor)

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
      <Grid container spacing={1}>
        <Grid size="grow">
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
              groupCalcValue,
              colorPicker.handleClose
            )}
          />
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
          {...{ colorByProp, colorPicker, anyNullValue }}
        />
      ) : (
        <>
          <NumericalColorLegend
            {...{
              group,
              colorBy,
              colorByProp,
              valueRange,
              numberFormat,
              anyNullValue,
              colorPicker,
              onChangePropAttr,
            }}
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
