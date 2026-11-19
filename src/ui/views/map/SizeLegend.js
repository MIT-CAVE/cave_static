import {
  Box,
  Grid,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PiDotsThreeBold } from 'react-icons/pi'
import { TbFocusAuto, TbPlus } from 'react-icons/tb'
import { useSelector } from 'react-redux'

import {
  GroupCalcSelector,
  PropIcon,
  ScaleSelector,
  GradientLabel,
  useGradient,
  WithEditBadge,
} from './Legend'
import StopMenu, {
  NEW_STOP_HIGHLIGHT_ANIMATION,
  getNewStopHighlightSx,
} from './StopMenu'

import { selectLegendNumberFormatFunc } from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import { resolveRichText } from '../../../utils/richText'
import { getNewGradientStop } from '../../../utils/scales'
import SizeSlider, { useSizeSlider } from '../../compound/SizeSlider'
import NumberField from '../../prototypes/NumberField'

import { OverflowText, RichLabel, Select, TextInput } from '../../compound'

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
    px: 0.5, // Room for the highlight of the first and last stops
  },
  scrollRoot: {
    height: '100%',
    width: '100%',
    pt: 0.75,
    px: 0.5,
    pb: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  scrollContent: {
    width: 'max-content',
    minWidth: '100%',
  },
  // Same relative width as the slider on its own, centered in its grid item
  sliderInRow: { width: '85%', mx: 'auto' },
  // The slider's track sits below its value label, so the button (centered in
  // its grid row) is shifted down to center on the track
  menuButton: { mt: '12px' },
  newStop: getNewStopHighlightSx('-2px -4px', 4),
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
  // Caps the width of `Min (label)`/`Max (label)` so a long label scrolls
  // instead of widening its column
  boundCaption: {
    maxWidth: '128px',
  },
  rangeLabel: {
    textAlign: 'center',
    maxWidth: '56px',
  },
  inputValue: {
    mt: '20px !important',
    flex: '1 1 auto',
    fieldset: {
      borderWidth: '2px !important',
      borderRadius: 0,
    },
  },
}

const NumericalSizeLegend = ({
  icon,
  group,
  valueRange,
  numberFormat,
  sizeSlider,
  // anyNullValue, // TODO: Implement `fallback` UI
  richText,
  onChangeValueAt,
  onChangeGradientAttr,
}) => {
  const [editValue, setEditValue] = useState(null)
  const [editLabelAt, setEditLabelAt] = useState({})
  // Position of the most recently added stop, while highlighted
  const [highlightedAt, setHighlightedAt] = useState(null)
  const clearHighlight = useCallback(() => setHighlightedAt(null), [])
  // Child animations (e.g. ripples) bubble `animationend`; only react to ours
  const handleAnimationEnd = useCallback(
    (event) => {
      if (event.animationName === NEW_STOP_HIGHLIGHT_ANIMATION) clearHighlight()
    },
    [clearHighlight]
  )

  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    handleSelect,
    handleClose,
    handleChange,
    handleChangeComitted: handleChangeComittedRaw,
  } = sizeSlider

  const { sizes, values, rawValues, labels, dataIndices } = useMemo(
    () => parseGradient('size', numberFormat.precision)(valueRange),
    [numberFormat.precision, valueRange]
  )

  const selectedRawValue = rawValues[sizeSliderProps.key]
  useEffect(() => {
    // Keep the edited value in sync with the selected stop, including after
    // stops are added or removed
    setEditValue(selectedRawValue ?? null)
  }, [selectedRawValue, sizeSliderProps.key])

  const {
    isStepScale,
    lastIndex,
    minAuto,
    maxAuto,
    getLabel,
    getPlainLabel,
    isServerLabelAt,
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
    richText,
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

  const gradient = valueRange.gradient

  const handleAddSizeAt = useCallback(
    (at) => {
      const newStop = getNewGradientStop({
        values,
        attrs: sizes,
        attr: 'size',
        at,
        scale: gradient.scale,
        scaleParams: gradient.scaleParams,
      })
      // `at` is a position among size stops; map it to a `gradient.data` index
      const lastSizeIndex = dataIndices.length - 1
      const insertIndex =
        at <= lastSizeIndex ? dataIndices[at] : dataIndices[lastSizeIndex] + 1
      onChangeGradientAttr(['data'])(
        R.insert(insertIndex, newStop)(gradient.data)
      )
      // Select the new stop so it can be edited right away
      handleSelect(at, newStop.size)
      setHighlightedAt(at)
    },
    [
      dataIndices,
      gradient.data,
      gradient.scale,
      gradient.scaleParams,
      handleSelect,
      onChangeGradientAttr,
      sizes,
      values,
    ]
  )

  const handleRemoveSizeAt = useCallback(
    (dataIndex) => {
      const gradientItem = gradient.data[dataIndex]
      if ('color' in gradientItem) {
        // Keep the item for its color
        onChangeGradientAttr(['data', dataIndex])(
          R.dissoc('size')(gradientItem)
        )
      } else {
        onChangeGradientAttr(['data'])(R.remove(dataIndex, 1)(gradient.data))
      }
      setHighlightedAt(null)
      // Select the previous stop (or the new first one)
      const index = dataIndices.indexOf(dataIndex)
      handleSelect(Math.max(index - 1, 0), sizes[index > 0 ? index - 1 : 1])
    },
    [dataIndices, gradient.data, handleSelect, onChangeGradientAttr, sizes]
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

  // Keep the selected stop visible (e.g. a newly added one)
  const scrollIntoViewRef = useCallback((element) => {
    element?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [])

  const selectedDataIndex = dataIndices[sizeSliderProps.key]
  const isLastStepItem = isStepScale && sizeSliderProps.key === lastIndex

  const renderStopMenu = (buttonSx) => (
    <StopMenu
      {...{ dataIndices, editLabelAt }}
      index={sizeSliderProps.key}
      attr="Size"
      horizontal
      buttonSx={buttonSx}
      onAddAt={handleAddSizeAt}
      onRemoveAt={handleRemoveSizeAt}
      onToggleEditLabelAt={handleToggleEditLabelAt}
    />
  )

  // `active` buttons are next to the selected stop. The others keep their
  // space, so stops do not shift: they are disabled on step scales (which have
  // no `...` to fill the gaps) and hidden otherwise.
  const renderAddButton = (at, active = true) => {
    // A dashed border at the edges, as the new stop is extrapolated
    const isEdge = at <= 0 || at >= sizes.length
    const borderStyle = isEdge ? 'dashed' : 'solid'
    return (
      <ToggleButton
        // `color` only applies to the selected state of a `ToggleButton`
        sx={{
          p: '1px',
          borderRadius: '50%',
          color: 'warning.main',
          borderColor: 'warning.main',
          borderStyle,
          borderWidth: '2px',
          // The disabled style resets the whole border, so it keeps the
          // (grey) color of MUI but needs the style and width set again
          '&.Mui-disabled': { borderStyle, borderWidth: '2px' },
          visibility: active || isStepScale ? 'visible' : 'hidden',
        }}
        color="warning"
        value="add-stop"
        aria-label={isEdge ? 'Add size (extrapolated)' : 'Add size'}
        disabled={!active}
        onClick={() => handleAddSizeAt(at)}
      >
        <TbPlus size={16} />
      </ToggleButton>
    )
  }

  // Both the `...` and the add button are centered in the same box
  const renderAddSlot = (content) => (
    <Typography
      variant="h6"
      component="div"
      sx={{
        // Offsets the captions below the icons (a single line on step scales)
        // so the content is centered with the icons
        pb: isStepScale ? 3.25 : 5.75,
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'stretch',
      }}
    >
      {content}
    </Typography>
  )

  // Whether the gap before the stop at `index` is next to the selected stop
  const isNextToSelected = (index) =>
    showSizeSlider &&
    (sizeSliderProps.key === index || sizeSliderProps.key === index - 1)

  // Add buttons at the edges, shown only next to the selected edge stop
  const showEdgeAddSlots = showSizeSlider

  const stops = (
    <Stack
      direction="row"
      spacing={2}
      sx={[
        styles.rangeRoot,
        // Fill the scroll container, but never shrink the stops
        showSizeSlider && styles.scrollContent,
      ]}
    >
      {showEdgeAddSlots &&
        renderAddSlot(renderAddButton(0, sizeSliderProps.key === 0))}
      {sizes.map((value, index) => {
        const selected = sizeSliderProps.key === index
        return (
          <Fragment key={index}>
            {index > 0 &&
              (showSizeSlider || !isStepScale) &&
              renderAddSlot(
                // The `...` next to the selected stop turns into an add button.
                // Step scales have no `...`, so their other slots stay empty
                isStepScale || isNextToSelected(index) ? (
                  renderAddButton(index, isNextToSelected(index))
                ) : (
                  // A shape close to the `...` glyph, centered like the button
                  <Box sx={{ display: 'flex', color: 'text.secondary' }}>
                    <PiDotsThreeBold size={24} />
                  </Box>
                )
              )}
            <Stack
              ref={selected ? scrollIntoViewRef : undefined}
              spacing={0.5}
              onAnimationEnd={
                index === highlightedAt ? handleAnimationEnd : undefined
              }
              onPointerDown={
                index === highlightedAt ? clearHighlight : undefined
              }
              sx={[
                // Stretch the stops so the icons are centered in the space above
                // the captions, as the add buttons are
                { alignItems: 'center', alignSelf: 'stretch' },
                index === highlightedAt && styles.newStop,
              ]}
            >
              {icon && (
                <WithEditBadge
                  editing={showSizeSlider && selected}
                  sx={{ flex: '1 1 auto', alignItems: 'center' }}
                >
                  <PropIcon
                    {...{ icon, selected }}
                    size={value}
                    onClick={handleOpen(index, sizes[index])}
                  />
                </WithEditBadge>
              )}
              <Stack>
                {!isStepScale &&
                  (index < 1 || index === lastIndex ? (
                    // Bounds keep `Min`/`Max` and append their custom label
                    <Typography
                      variant="caption"
                      color={selected ? 'warning' : 'default'}
                      sx={styles.boundCaption}
                      noWrap
                    >
                      <OverflowText
                        text={
                          isServerLabelAt(index)
                            ? `${index < 1 ? 'Min' : 'Max'} (${getPlainLabel(index)})`
                            : getAdjustedLabel(index < 1 ? 'Min' : 'Max', index)
                        }
                      />
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      color={selected ? 'warning' : 'default'}
                      noWrap
                    >
                      <GradientLabel
                        text={getAdjustedLabel(
                          labels[index] != null ? getLabel(index) : `\u2063`, // This preserves the alignment of the icons
                          index
                        )}
                        rawLabel={getLabel(index)}
                        rich={
                          richText === true &&
                          labels[index] != null &&
                          isServerLabelAt(index)
                        }
                      />
                    </Typography>
                  ))}
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
          </Fragment>
        )
      })}
      {showEdgeAddSlots &&
        renderAddSlot(
          renderAddButton(sizes.length, sizeSliderProps.key === lastIndex)
        )}
    </Stack>
  )

  return (
    <>
      {showSizeSlider ? (
        // A marquee can not be scrolled, so the stops are scrollable while editing
        <Box sx={styles.scrollRoot}>{stops}</Box>
      ) : (
        <OverflowText sx={styles.marqueRoot}>{stops}</OverflowText>
      )}

      {showSizeSlider && (
        <Stack useFlexGap>
          {isLastStepItem ? (
            // The value field is hidden here, so the menu goes next to the slider
            <Grid container spacing={1} sx={{ alignItems: 'center' }}>
              <Grid size="grow">
                <SizeSlider
                  sx={styles.sliderInRow}
                  value={sizeSliderProps.value}
                  onClose={handleClose}
                  onChange={handleChange}
                  onChangeCommitted={handleChangeComittedAt(
                    dataIndices[sizeSliderProps.key]
                  )}
                />
              </Grid>
              <Grid size="auto">{renderStopMenu(styles.menuButton)}</Grid>
            </Grid>
          ) : (
            <SizeSlider
              value={sizeSliderProps.value}
              onClose={handleClose}
              onChange={handleChange}
              onChangeCommitted={handleChangeComittedAt(
                dataIndices[sizeSliderProps.key]
              )}
            />
          )}
          <Grid container spacing={1} sx={{ alignItems: 'center' }}>
            <Grid container spacing={1} size="grow">
              {
                // Do not display the max value for a step function
                // scale, as it does not affect the function output
                !(isLastStepItem || editValue == null) && (
                  <Grid size={12}>
                    <NumberField
                      color="warning"
                      sx={styles.inputValue}
                      label={getValueLabelAt(sizeSliderProps.key)}
                      value={editValue}
                      {...{ numberFormat }}
                      onChange={(event, newValue) => {
                        setEditValue(newValue)
                      }}
                      onChangeCommitted={(event, newValue) => {
                        onChangeValueAt(selectedDataIndex)(newValue)
                      }}
                      // Show auto min/max button if custom min/max values are set
                      endAdornments={
                        (sizeSliderProps.key < 1 && !minAuto) ||
                        (sizeSliderProps.key === lastIndex && !maxAuto) ? (
                          <IconButton
                            size="small"
                            onClick={handleSetAutoValueAt(
                              selectedDataIndex,
                              sizeSliderProps.key
                            )}
                          >
                            <TbFocusAuto />
                          </IconButton>
                        ) : null
                      }
                    />
                  </Grid>
                )
              }
              {editLabelAt[selectedDataIndex] && (
                <Grid size={12} sx={{ mt: 1 }}>
                  <TextInput
                    key={selectedDataIndex}
                    color="warning"
                    label={`Label${labels[sizeSliderProps.key] == null || labels[sizeSliderProps.key] === '' ? ` \u279D ${getSizeLabelAt(sizeSliderProps.key)}` : ''}`}
                    value={labels[sizeSliderProps.key]}
                    onClickAway={onChangeGradientAttr([
                      'data',
                      selectedDataIndex,
                      'label',
                    ])}
                  />
                </Grid>
              )}
            </Grid>
            {!isLastStepItem && (
              <Grid size="auto">
                {renderStopMenu({ mt: '20px !important' })}
              </Grid>
            )}
          </Grid>
        </Stack>
      )}
    </>
  )
}

const CategoricalSizeLegend = ({
  sizeByProp,
  icon,
  sizeSlider,
  anyNullValue,
  richText,
}) => {
  const {
    showSizeSlider,
    sizeSliderProps,
    handleOpen,
    handleClose,
    handleChange,
    handleChangeComitted: handleChangeComittedRaw,
  } = sizeSlider
  const type = sizeByProp.type

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

  // Only the names set in the data are rich text, not the generated ones
  const isCategoryRich = useCallback(
    (option) =>
      richText === true &&
      (type === propId.SELECTOR || type === propId.TOGGLE) &&
      Boolean(sizeOptions[option]?.name),
    [richText, sizeOptions, type]
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
                <RichLabel
                  text={getCategoryLabel(option)}
                  rich={isCategoryRich(option)}
                />
              </Typography>
            </Stack>
          ))}
        </Stack>
      </OverflowText>
      {showSizeSlider && (
        <SizeSlider
          sx={{ mb: 4 }}
          sizeLabel={getCategoryLabel(sizeSliderProps.key)}
          sizeRichText={isCategoryRich(sizeSliderProps.key)}
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
  richText,
}) => {
  const legendNumberFormatFunc = useSelector(selectLegendNumberFormatFunc)
  const sizeByProp = featureTypeProps[sizeBy]
  const numberFormat = legendNumberFormatFunc(sizeByProp)
  const isCategorical = sizeByProp.type !== propId.NUMBER
  // The `richText` of the prop overrides the one of its feature type
  const propRichText = resolveRichText(sizeByProp.richText, richText)

  const sizeSlider = useSizeSlider(onChangeSize)

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
          <Select
            id="size-by"
            labelId="size-by-label"
            label="Size by"
            value={sizeBy}
            optionsList={sizeByOptions}
            getLabel={(option) => featureTypeProps[option].name || option}
            richText={(option) =>
              resolveRichText(featureTypeProps[option]?.richText, richText) ===
              true
            }
            onSelect={onSelectProp(
              'sizeBy',
              'groupCalcBySize',
              groupCalcValue,
              sizeSlider.handleClose
            )}
          />
        </Grid>
        {numberFormat.unit && (
          <Grid size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit}>
                {propRichText === true && (
                  <RichLabel text={numberFormat.unit} />
                )}
              </OverflowText>
            </Typography>
          </Grid>
        )}
      </Grid>
      {isCategorical ? (
        <CategoricalSizeLegend
          {...{ icon, sizeByProp, sizeSlider, anyNullValue }}
          richText={propRichText}
        />
      ) : (
        <>
          <NumericalSizeLegend
            {...{
              valueRange,
              numberFormat,
              icon,
              group,
              sizeSlider,
              anyNullValue,
            }}
            richText={propRichText}
            onChangeValueAt={(dataIndex) =>
              onChangePropAttr([sizeBy, 'gradient', 'data', dataIndex, 'value'])
            }
            onChangeGradientAttr={(pathTail) =>
              onChangePropAttr([sizeBy, 'gradient', ...pathTail])
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
