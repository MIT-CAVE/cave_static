import {
  Box,
  Button,
  capitalize,
  Divider,
  Grid,
  IconButton,
  Paper,
  Popper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import {
  MdOutlineFactCheck,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md'
import { PiInfo } from 'react-icons/pi'
import { RiSettings5Line } from 'react-icons/ri'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectArcRange,
  selectArcTypeKeys,
  selectGeoRange,
  selectLegendDataFunc,
  selectLocalizedArcTypes,
  selectLocalizedGeoTypes,
  selectLocalizedNodeTypes,
  selectNodeRange,
  selectNodeRangeAtZoomFunc,
  selectNodeTypeKeys,
  selectNumberFormatPropsFn,
  selectSync,
} from '../../../data/selectors'
import { propId } from '../../../utils/enums'
import { useMenu } from '../../../utils/hooks'

import { FetchedIcon, OverflowText, Select } from '../../compound'

import {
  getContrastText,
  getLabelFn,
  includesPath,
  NumberFormat,
  withIndex,
} from '../../../utils'

const styles = {
  root: {
    width: 'auto',
    minWidth: '120px',
    maxWidth: '600px',
    p: (theme) => theme.spacing(0, 1, 1),
    mx: 0,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
  },
  legendGroup: {
    alignItems: 'start',
    mt: 1,
    px: 1,
    py: 0.5,
  },
  popper: {
    width: '256px',
    position: 'absolute',
  },
  popperContent: {
    p: 1.5,
    border: 1,
    width: '100%',
    color: 'text.primary',
    bgcolor: 'background.paper',
  },
  categoryRoot: {
    width: '100%',
    mt: 1,
  },
  category: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 0.75,
    mx: 'auto',
    minWidth: '12px',
    height: '12px',
    borderRadius: 1,
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
    height: '20px',
    minWidth: '80px',
    width: 'auto',
    borderRadius: 0.5,
    backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
  }),
  unit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    border: 1,
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
  },
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

const GradientBox = ({
  group,
  valueRange,
  colorBy,
  colorByOptions,
  numberFormat,
}) => {
  const minColor = colorByOptions[colorBy].startGradientColor
  const maxColor = colorByOptions[colorBy].endGradientColor
  const minLabel = getMinLabel(valueRange, numberFormat, group)
  const maxLabel = getMaxLabel(valueRange, numberFormat, group)

  return (
    <Grid
      container
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={styles.gradientRoot}
    >
      <Grid item xs={3} sx={{ textAlign: 'center', paddingRight: 0 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'normal', textAlign: 'center' }}
        >
          Min
        </Typography>
        <Typography
          component={OverflowText}
          variant="body1"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
          }}
        >
          {minLabel}
        </Typography>
      </Grid>

      <Grid item xs={6} sx={{ textAlign: 'center', padding: 0 }}>
        <Box sx={styles.getGradient(minColor, maxColor)} />
      </Grid>

      <Grid item xs={3} sx={{ textAlign: 'center', paddingLeft: 0 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 'normal', textAlign: 'center' }}
        >
          Max
        </Typography>
        <Typography
          component={OverflowText}
          variant="body1"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
          }}
        >
          {maxLabel}
        </Typography>
      </Grid>
    </Grid>
  )
}

const CategoricalColors = ({
  type,
  colorBy,
  colorByOptions,
  featureTypeProps,
}) => {
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
    <OverflowText sx={styles.categoryRoot}>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
        {Object.entries(colorOptions).map(([opt, val]) => (
          <Paper
            key={opt}
            sx={[
              styles.category,
              { color: getContrastText(val), bgcolor: val },
            ]}
            elevation={3}
          >
            <Typography variant="caption">{getCategoryLabel(opt)}</Typography>
          </Paper>
        ))}
      </Stack>
    </OverflowText>
  )
}

const ColorLegend = ({
  group,
  valueRange,
  colorBy,
  colorByOptions,
  featureTypeProps,
  onSelect,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const colorByProp = featureTypeProps[colorBy]
  const numberFormat = getNumberFormatProps(colorByProp)
  const isCategorical = colorByProp.type !== propId.NUMBER

  return (
    <Stack spacing={2} sx={{ width: '100%', padding: 0 }}>
      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="flex-start"
      >
        <Grid item xs={numberFormat.unit ? 8 : 12}>
          <Select
            fullWidth
            size="small"
            value={colorBy}
            optionsList={Object.keys(colorByOptions)}
            getLabel={(prop) => featureTypeProps[prop].name || prop}
            {...{ onSelect }}
          />
        </Grid>

        {numberFormat.unit && (
          <Grid item xs={4}>
            <Box sx={styles.unit}>
              <Typography
                variant="subtitle1"
                sx={{
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {numberFormat.unit}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {isCategorical ? (
        <CategoricalColors
          type={colorByProp.type}
          {...{ colorBy, colorByOptions, featureTypeProps }}
        />
      ) : (
        <GradientBox
          {...{
            group,
            valueRange,
            colorBy,
            colorByOptions,
            numberFormat,
          }}
        />
      )}
    </Stack>
  )
}

// TODO: Implement this component
const SizeLegend = ({
  group,
  valueRange,
  sizeBy,
  sizeByOptions,
  featureTypeProps,
  onSelectProp,
  icon,
}) => {
  console.log(
    valueRange.endSize,
    valueRange.startSize,
    valueRange.max,
    valueRange.min
  )
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const sizeByProp = featureTypeProps[sizeBy]
  const numberFormat = getNumberFormatProps(sizeByProp)
  const isCategorical = sizeByProp.type !== propId.NUMBER

  const handleSelectSize = (newSize) => {
    onSelectProp(newSize)
  }

  const renderNumericSize = () => {
    const minLabel = getMinLabel(valueRange, numberFormat, group)
    const maxLabel = getMaxLabel(valueRange, numberFormat, group)

    return (
      <Grid
        container
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Grid item xs={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Min
          </Typography>
          <Typography
            component={OverflowText}
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {minLabel}
          </Typography>
        </Grid>

        <Grid item xs={6} container alignItems="center" justifyContent="center">
          <Grid
            item
            container
            xs={6}
            alignItems="center"
            justifyContent="center"
          >
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  width: valueRange.startSize,
                  height: valueRange.startSize,
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            )}
          </Grid>
          <Grid
            item
            container
            xs={6}
            alignItems="center"
            justifyContent="center"
          >
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  width: valueRange.endSize,
                  height: valueRange.endSize,
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            )}
          </Grid>
        </Grid>

        <Grid item xs={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Max
          </Typography>
          <Typography
            component={OverflowText}
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {maxLabel}
          </Typography>
        </Grid>
      </Grid>
    )
  }

  const renderCategoricalSize = () => (
    <Stack direction="row" spacing={1.5} justifyContent="center">
      {Object.entries(sizeByOptions).map(([category]) => (
        <Paper key={category} sx={{ padding: 0.5, textAlign: 'center' }}>
          <Typography variant="caption">{category}</Typography>
        </Paper>
      ))}
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Grid container alignItems="center" justifyContent="center" spacing={1}>
        <Grid item xs={8}>
          <Select
            fullWidth
            size="small"
            value={sizeBy}
            optionsList={Object.keys(sizeByOptions)}
            getLabel={(option) => featureTypeProps[option].name || option}
            onSelect={handleSelectSize}
          />
        </Grid>
        {numberFormat.unit && (
          <Grid item xs={4}>
            <Box sx={styles.unit}>
              <Typography
                component={OverflowText}
                variant="subtitle1"
                sx={{ textAlign: 'center' }}
              >
                {numberFormat.unit}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {isCategorical ? renderCategoricalSize() : renderNumericSize()}
    </Box>
  )
}

const HeightLegend = ({
  valueRange,
  heightBy,
  heightByOptions,
  featureTypeProps,
  onSelectProp,
  icon,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const heightByProp = featureTypeProps[heightBy]
  const numberFormat = getNumberFormatProps(heightByProp)
  const isCategorical = heightByProp.type !== propId.NUMBER

  const handleSelectHeight = (newSize) => {
    onSelectProp(newSize)
  }

  const renderNumericHeight = () => {
    return (
      <Grid
        container
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Grid item xs={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Min
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.min}
          </Typography>
        </Grid>

        <Grid item xs={6} container alignItems="center" justifyContent="center">
          <Grid
            item
            container
            xs={6}
            alignItems="center"
            justifyContent="center"
          >
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
          </Grid>
          <Grid
            item
            container
            xs={6}
            alignItems="center"
            justifyContent="center"
          >
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
          </Grid>
        </Grid>

        <Grid item xs={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Max
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.max}
          </Typography>
        </Grid>
      </Grid>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Grid container alignItems="center" justifyContent="center" spacing={1}>
        <Grid item xs={8}>
          <Select
            fullWidth
            size="small"
            value={heightBy}
            optionsList={Object.keys(heightByOptions)}
            getLabel={(option) => featureTypeProps[option].name || option}
            onSelect={handleSelectHeight}
          />
        </Grid>
        {numberFormat.unit && (
          <Grid item xs={4}>
            <Box sx={styles.unit}>
              <Typography
                component={OverflowText}
                variant="subtitle1"
                sx={{
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {numberFormat.unit}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {isCategorical ? renderCategoricalHeight() : renderNumericHeight()}
    </Box>
  )
}

const LegendRowDetails = ({
  mapId,
  legendGroupId,
  id,
  icon,
  name,
  value,
  group,
  colorBy,
  colorByOptions,
  sizeBy,
  sizeByOptions,
  heightBy,
  heightByOptions,
  featureTypeProps,
  getRange,
  onChangeVisibility,
}) => {
  const [selected, setSelected] = useState(false)

  const sync = useSelector(selectSync)
  const getRangeOnZoom = useSelector(selectNodeRangeAtZoomFunc)
  const dispatch = useDispatch()

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  // Valid ranges for all features
  const colorRange = useMemo(
    () => getRange(id, colorBy, mapId, 'colorByOptions'),
    [colorBy, getRange, id, mapId]
  )
  const sizeRange = useMemo(
    () => getRange(id, sizeBy, mapId, 'sizeByOptions'),
    [sizeBy, getRange, id, mapId]
  )
  // Groupable nodes (only)
  const clusterRange = useMemo(() => {
    if (getRangeOnZoom == null) return {}
    return getRangeOnZoom(mapId)
  }, [getRangeOnZoom, mapId])
  // Geos (only)
  const heightRange = useMemo(
    () =>
      heightBy != null
        ? getRange(id, heightBy, mapId, 'heightByOptions')
        : null,
    [getRange, heightBy, id, mapId]
  )

  const handleSelectProp = useCallback(
    (pathEnd) => (value, event) => {
      const path = [
        'maps',
        'data',
        mapId,
        'legendGroups',
        legendGroupId,
        'data',
        id,
        pathEnd,
      ]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(Object.values(sync), path),
        })
      )
      event.stopPropagation()
    },
    [dispatch, id, legendGroupId, mapId, sync]
  )

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
      <PiInfo />
      <Popper
        {...{ anchorEl }}
        placement="right"
        sx={styles.popper}
        open={Boolean(anchorEl) || selected}
        onClose={handleCloseMenu}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <Grid
          container
          spacing={1}
          sx={styles.popperContent}
          direction="column"
        >
          <Grid container sx={{ alignItems: 'center' }}>
            <Grid size="auto">
              <Switch
                size="small"
                checked={value}
                onClick={onChangeVisibility}
              />
            </Grid>
            <Grid size="auto">
              <FetchedIcon iconName={icon} />
            </Grid>
            <Grid size="grow">
              <Typography component={OverflowText} variant="subtitle">
                {name}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ mt: 1 }} />
          {colorBy != null && (
            <ColorLegend
              valueRange={
                group && clusterRange.color ? clusterRange.color : colorRange
              }
              {...{
                legendGroupId,
                mapId,
                group,
                colorBy,
                colorByOptions,
                featureTypeProps,
              }}
              onSelect={handleSelectProp('colorBy')}
            />
          )}
          <Divider sx={{ mt: 1, mb: 1 }} />
          {sizeBy != null && (
            <SizeLegend
              valueRange={
                group && clusterRange.size ? clusterRange.size : sizeRange
              }
              {...{
                legendGroupId,
                mapId,
                group,
                sizeBy,
                sizeByOptions,
                featureTypeProps,
              }}
              onSelectProp={handleSelectProp('sizeBy')}
              icon={<FetchedIcon iconName={icon} />}
            />
          )}
          {heightBy != null && (
            <HeightLegend
              valueRange={heightRange}
              {...{
                legendGroupId,
                mapId,
                heightBy,
                heightByOptions,
                featureTypeProps,
              }}
              onSelect={handleSelectProp('heightBy')}
              icon={<FetchedIcon iconName={icon} />}
            />
          )}
        </Grid>
      </Popper>
    </ToggleButton>
  )
}

const LegendRow = ({ id, featureTypeData, settingsMode, ...props }) => {
  const name = getLabelFn(featureTypeData, id)
  return (
    <Grid container spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
      {settingsMode && (
        <Grid item>
          <Switch
            name={`cave-toggle-map-${id}`}
            size="small"
            checked={props.value}
            onClick={props.onChangeVisibility}
          />
        </Grid>
      )}
      <Grid item>
        <FetchedIcon iconName={props.icon} />
      </Grid>
      <Grid item xs>
        <Typography variant="caption">{name}</Typography>
      </Grid>
      {!settingsMode && (
        <Grid item>
          <LegendRowDetails
            featureTypeProps={featureTypeData[id].props}
            {...{ id, name, ...props }}
          />
        </Grid>
      )}
    </Grid>
  )
}

const LegendRowNode = (props) => {
  const nodeTypes = useSelector(selectLocalizedNodeTypes)
  const getRange = useSelector(selectNodeRange)
  return <LegendRow featureTypeData={nodeTypes} {...{ getRange, ...props }} />
}

const LegendRowArc = (props) => {
  const arcTypes = useSelector(selectLocalizedArcTypes)
  const getRange = useSelector(selectArcRange)
  const icon = useMemo(
    () =>
      props.lineBy === 'dotted'
        ? 'ai/AiOutlineEllipsis'
        : props.lineBy === 'dashed'
          ? 'ai/AiOutlineDash'
          : props.lineBy === '3d'
            ? 'vsc/VscLoading'
            : 'ai/AiOutlineLine',
    [props.lineBy]
  )
  return (
    <LegendRow featureTypeData={arcTypes} {...{ icon, getRange, ...props }} />
  )
}

const LegendRowGeo = (props) => {
  const geoTypes = useSelector(selectLocalizedGeoTypes)
  const getRange = useSelector(selectGeoRange)
  return <LegendRow featureTypeData={geoTypes} {...{ getRange, ...props }} />
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
    (legendGroupId, mapFeatureType) => (event) => {
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
    [dispatch, mapId, sync]
  )

  const LegendRowClass = nodeTypes.includes(id)
    ? LegendRowNode
    : arcTypes.includes(id)
      ? LegendRowArc
      : LegendRowGeo

  return (
    <LegendRowClass
      {...{ mapId, legendGroupId, id, value, settingsMode, ...props }}
      onChangeVisibility={handleChangeVisibility(legendGroupId, id)}
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
        <Grid container spacing={1} sx={{ alignItems: 'center' }}>
          {settingsMode && (
            <Grid size="auto">
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
            </Grid>
          )}
          <Grid size="grow">
            <Typography variant="subtitle1">{legendGroup.name}</Typography>
          </Grid>
        </Grid>
      )}
      {legendGroupData.map(({ id, value, ...props }, index) => {
        const legendGroupId = legendGroup.id
        return value || settingsMode ? (
          <Fragment key={id}>
            {index > 0 && <Divider sx={{ opacity: 0.6, width: '100%' }} />}
            <MapFeature
              {...{ mapId, legendGroupId, id, value, settingsMode, ...props }}
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

const MinimalLegend = ({ mapId, onChangeView }) => {
  const [settingsMode, setSettingsMode] = useState(false)
  const [showLegendGroupName, setShowLegendGroupName] = useState(true)

  const handleToggleLegendGroupName = useCallback(() => {
    setShowLegendGroupName(!showLegendGroupName)
  }, [showLegendGroupName])

  return (
    <Box sx={styles.root}>
      <Grid container spacing={1} sx={{ alignItems: 'center', px: 0.8 }}>
        <Grid size="grow" sx={{ textAlign: 'start' }}>
          <Typography variant="h6">
            {settingsMode ? 'Settings' : 'Legend'}
          </Typography>
        </Grid>
        <Grid size="auto">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSettingsMode(!settingsMode)
            }}
          >
            {settingsMode ? <MdOutlineFactCheck /> : <RiSettings5Line />}
          </IconButton>
        </Grid>
      </Grid>

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
          onToggleLegendGroupName={handleToggleLegendGroupName}
        />
      )}
    </Box>
  )
}

export default memo(MinimalLegend)
