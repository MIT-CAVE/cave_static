import {
  Badge,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useContext, useMemo } from 'react'
import { LuGroup, LuRadius, LuUngroup } from 'react-icons/lu'
import { MdFilterAlt } from 'react-icons/md'
import { useSelector } from 'react-redux'

import ColorLegend from './ColorLegend'
import HeightLegend from './HeightLegend'
import {
  LegendHeader,
  LegendRoot,
  useLegendPopper,
  useLegendDetails,
  WithEditBadge,
  LegendRowNode,
  LegendRowArc,
  LegendRowGeo,
  LegendPopper,
  LegendSettings,
  LegendColorMarker,
  GroupScaleControls,
} from './Legend'
import SizeLegend from './SizeLegend'
import { MapContext } from './useMapApi'
import useMapFilter from './useMapFilter'

import {
  selectArcTypeKeys,
  selectLegendDataFunc,
  selectLegendLayout,
  selectLegendWidth,
  selectNodeTypeKeys,
  selectShowLegendAdvancedControls,
  selectShowLegendGroupNames,
} from '../../../data/selectors'
import { LEGEND_SLIM_WIDTH, LEGEND_WIDE_WIDTH } from '../../../utils/constants'
import { legendLayouts, legendWidths, statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { useSizeSlider } from '../../compound/SizeSlider'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import {
  FetchedIcon,
  OptionalWrapper,
  OverflowText,
  ShapePicker,
} from '../../compound'

import { getNumActiveFilters, withIndex } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    minWidth: '120px',
    maxWidth: '600px',
    p: 1,
    mx: 0,
    color: 'text.primary',
    border: '2px outset',
    borderColor: 'grey.600',
    borderRadius: 1,
  },
  legendGroup: {
    alignItems: 'start',
    border: '1px outset rgb(128 128 128)',
  },
  details: {
    maxHeight: '100%',
    maxWidth: '100%',
    bgcolor: 'grey.800',
    p: 1,
    border: '1px outset rgb(128 128 128)',
    boxSizing: 'border-box',
  },
  toggleButton: {
    p: 1,
    borderRadius: '50%',
  },
  warning: {
    textAlign: 'start',
    px: 1,
    py: 0,
  },
}

const LegendRowDetails = ({
  legendGroupId,
  id,
  icon,
  name,
  value,
  allowGrouping,
  colorBy,
  sizeBy,
  heightBy,
  colorByOptions,
  sizeByOptions,
  heightByOptions,
  // shapeBy, // TODO: `shapeBy` would be a unifying property for `iconBy` and `lineBy`?
  shape,
  shapeLabel,
  shapePathEnd,
  shapeOptions,
  shapeWarning,
  ListboxComponent,
  groupBy,
  getShapeIcon,
  getShapeLabel,
  getShapeDisabled,
  group,
  groupScale = 50,
  groupScaleWithZoom,
  groupCalcByColor = statId.COUNT,
  groupCalcBySize = statId.COUNT,
  filters,
  featureTypeProps,
  featureTypeValues,
  getRange,
  onChangeVisibility,
}) => {
  const { mapId } = useContext(MapContext)
  const legendLayout = useSelector(selectLegendLayout)[mapId]
  const showLegendAdvancedControls = useSelector(
    selectShowLegendAdvancedControls
  )[mapId]
  const [showShapePicker, handleToggleShapePicker] = useToggle(false)
  const {
    basePath,
    colorRange,
    sizeRange,
    clusterRange,
    heightRange,
    hasAnyNullValue,
    handleChangeLegendAttr,
    handleSelectProp,
    handleToggleGroup: handleToggleGroupRaw,
    handleChangeColor,
    handleChangeSize,
    handleChangeShape,
    handleChangePropAttr,
  } = useLegendDetails({
    legendGroupId,
    id,
    group,
    colorBy,
    sizeBy,
    heightBy,
    shapePathEnd,
    featureTypeProps,
    featureTypeValues,
    getRange,
  })
  const {
    filterOpen,
    labelStart,
    numActiveFilters,
    isFilterDisabled,
    filterableProps,
    filterableExtraProps,
    handleOpenFilter,
    handleCloseFilter,
    handleSaveFilters,
  } = useMapFilter({
    group,
    featureTypeProps,
    filtersPath: [...basePath, 'filters'],
    filters,
  })
  const {
    showSizeSlider: showGroupControls,
    handleOpen: handleOpenGroupScale,
    ...groupScaleSlider
  } = useSizeSlider(handleChangeLegendAttr, null)
  const layoutDirection =
    legendLayout === legendLayouts.AUTO || legendLayout === legendLayouts.ROW
      ? 'column'
      : 'row'

  const handleToggleGroup = useCallback(
    (event, value) => {
      if (value) groupScaleSlider.handleClose(event) // Close the Scale Group when grouping is disabled
      handleToggleGroupRaw(event, value)
    },
    [handleToggleGroupRaw, groupScaleSlider]
  )
  return (
    <Stack component={Paper} elevation={1} spacing={1} sx={styles.details}>
      <Grid container sx={{ alignItems: 'center' }} spacing={1}>
        <Grid size="auto">
          <Switch
            name="map-feature-switch"
            size="small"
            checked={value}
            onClick={onChangeVisibility}
          />
        </Grid>
        <Grid size="auto">
          <WithEditBadge editing={showShapePicker}>
            <OptionalWrapper
              component={ToggleButton}
              wrap={shapeOptions != null}
              wrapperProps={{
                color: showShapePicker ? 'warning' : null,
                selected: shapeOptions != null,
                value: 'shape',
                sx: styles.toggleButton,
                onClick: handleToggleShapePicker,
              }}
            >
              <FetchedIcon iconName={icon} size={24} />
            </OptionalWrapper>
          </WithEditBadge>
        </Grid>
        <Grid size="grow">
          <Typography variant="subtitle1" sx={{ textAlign: 'start' }}>
            <OverflowText text={name} />
          </Typography>
        </Grid>
        <Grid size="auto">
          {allowGrouping && (
            <>
              <ToggleButton
                color={group ? 'primary' : null}
                selected={group}
                value={group}
                sx={styles.toggleButton}
                onClick={handleToggleGroup}
              >
                {group ? <LuGroup size={24} /> : <LuUngroup size={24} />}
              </ToggleButton>
              {showLegendAdvancedControls && (
                <WithEditBadge editing={showGroupControls}>
                  <ToggleButton
                    disabled={!group}
                    color={showGroupControls ? 'warning' : null}
                    selected={showGroupControls}
                    value="showGroupControls"
                    sx={[styles.toggleButton, { mx: 0.5 }]}
                    onClick={handleOpenGroupScale('groupScale', groupScale)}
                  >
                    <LuRadius size={24} />
                  </ToggleButton>
                </WithEditBadge>
              )}
            </>
          )}
          {/* Filter */}
          <DataGridModal
            open={filterOpen}
            label="Chart Data Filter"
            labelExtra={`(${labelStart ? `${labelStart} \u279D ` : ''}${name})`}
            onClose={handleCloseFilter}
          >
            <GridFilter
              {...{ filterableExtraProps }}
              filterables={filterableProps}
              defaultFilters={filters}
              onSave={handleSaveFilters}
            />
          </DataGridModal>
          <IconButton disabled={isFilterDisabled} onClick={handleOpenFilter}>
            <Badge
              color={isFilterDisabled ? 'default' : 'info'}
              badgeContent={numActiveFilters}
            >
              <MdFilterAlt />
            </Badge>
          </IconButton>
        </Grid>
      </Grid>
      <Stack useFlexGap spacing={1} sx={{ mb: 1 }}>
        {showShapePicker && (
          <>
            {shapeWarning && (
              <Typography variant="caption" sx={styles.warning}>
                {shapeWarning}
              </Typography>
            )}
            <ShapePicker
              label={shapeLabel}
              value={shape}
              options={shapeOptions}
              color="warning"
              {...{ ListboxComponent, groupBy }}
              getIcon={getShapeIcon}
              getLabel={getShapeLabel}
              getDisabled={getShapeDisabled}
              onChange={handleChangeShape}
            />
          </>
        )}
        {showLegendAdvancedControls && showGroupControls && (
          <GroupScaleControls
            {...{ groupScaleWithZoom, ...groupScaleSlider }}
            onChangeLegendAttr={handleChangeLegendAttr}
          />
        )}
      </Stack>

      <Divider sx={{ mx: -1.5 }} />
      <Grid
        container
        direction={layoutDirection}
        spacing={1}
        sx={{ overflow: 'auto' }}
        wrap={layoutDirection === 'row' ? 'wrap' : 'nowrap'}
      >
        {colorBy != null && (
          <Grid size="grow">
            <ColorLegend
              valueRange={
                group && clusterRange.color
                  ? R.mergeDeepLeft(clusterRange.color, colorRange)
                  : colorRange
              }
              {...{
                group,
                colorBy,
                colorByOptions,
                featureTypeProps,
              }}
              anyNullValue={hasAnyNullValue(colorBy)}
              groupCalcValue={groupCalcByColor}
              onSelectProp={handleSelectProp}
              onChangeLegendAttr={handleChangeLegendAttr}
              onChangePropAttr={handleChangePropAttr}
              onChangeColor={handleChangeColor}
            />
          </Grid>
        )}
        {sizeBy != null && (
          <Grid size="grow">
            <SizeLegend
              valueRange={
                group && clusterRange.size
                  ? R.mergeDeepLeft(clusterRange.size, sizeRange)
                  : sizeRange
              }
              {...{
                icon,
                group,
                sizeBy,
                sizeByOptions,
                featureTypeProps,
              }}
              anyNullValue={hasAnyNullValue(sizeBy)}
              groupCalcValue={groupCalcBySize}
              onSelectProp={handleSelectProp}
              onChangeLegendAttr={handleChangeLegendAttr}
              onChangePropAttr={handleChangePropAttr}
              onChangeSize={handleChangeSize}
            />
          </Grid>
        )}
        {/* FIXME: `heightBy` is temporarily hidden */}
        {heightBy != null && false && (
          <Grid size="grow">
            <HeightLegend
              valueRange={heightRange}
              {...{
                legendGroupId,
                heightBy,
                heightByOptions,
                featureTypeProps,
              }}
              anyNullValue={hasAnyNullValue(heightBy)}
              icon={<FetchedIcon iconName={icon} />}
              onChangePropAttr={handleChangePropAttr}
              onSelectProp={handleSelectProp('heightBy')}
            />
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

const LegendRow = ({ mapFeaturesBy, anchorEl, onOpen, onClose, ...props }) => {
  const { mapId } = useContext(MapContext)

  const { id, group, icon, colorBy, filters, getRange, onChangeVisibility } =
    props
  const legendWidth = useSelector(selectLegendWidth)[mapId]

  const mapFeatures = mapFeaturesBy(id, mapId)

  // Some features may be empty, so we need to default to an empty object to avoid errors
  const firstFeature = mapFeatures[0] ?? {}
  const featureTypeProps = firstFeature.props
  const name = firstFeature.name ?? id

  const numActiveFilters = useMemo(
    () => getNumActiveFilters(filters),
    [filters]
  )
  const featureTypeValues = useMemo(
    () => mapFeatures.map((feature) => feature.values),
    [mapFeatures]
  )
  const hasAnyNullValue = useCallback(
    (propId) =>
      !group && R.pipe(R.pluck(propId), R.any(R.isNil))(featureTypeValues),
    [featureTypeValues, group]
  )
  const handleChangeVisibility = useCallback(
    (event) => {
      onChangeVisibility(event)
      event.stopPropagation()
    },
    [onChangeVisibility]
  )

  if (mapFeatures.length === 0) return null

  const open = Boolean(anchorEl)
  const popperWidth =
    legendWidth === legendWidths.WIDE ? LEGEND_WIDE_WIDTH : LEGEND_SLIM_WIDTH
  return (
    <ToggleButton
      fullWidth
      size="small"
      color="primary"
      value="details"
      selected={open}
      sx={{ textTransform: 'initial', borderRadius: 0, border: 'none' }}
      // Toggle when clicking on the opened popper
      onClick={anchorEl == null ? onOpen : onClose}
    >
      <Grid
        key={id}
        container
        spacing={1}
        sx={{ alignItems: 'center', width: '100%' }}
      >
        <Grid size="auto">
          <Switch
            name={`cave-toggle-map-${id}`}
            size="small"
            checked={props.value}
            onClick={handleChangeVisibility}
          />
        </Grid>
        <Grid size="auto" sx={{ display: 'flex' }}>
          <FetchedIcon iconName={icon} size={20} />
        </Grid>
        <Grid size="grow" sx={{ textAlign: 'start' }}>
          <Typography variant="caption">{name}</Typography>
        </Grid>
        <Grid size="auto">
          <LegendPopper
            {...{ anchorEl, onClose }}
            IconComponent={() => (
              <LegendColorMarker
                colorByProp={featureTypeProps[colorBy]}
                anyNullValue={hasAnyNullValue(colorBy)}
                {...{ id, group, colorBy, getRange }}
              />
            )}
            slotProps={{
              badge: {
                showBadge: numActiveFilters > 0,
                overlap: 'rectangular',
                size: 14,
                color: '#29b6f6',
                reactIcon: () => <MdFilterAlt color="#4a4a4a" />,
                sx: { right: 0, top: 0 },
              },
              popper: { sx: { width: popperWidth } },
            }}
          >
            <LegendRowDetails
              {...{
                name,
                featureTypeProps,
                featureTypeValues,
                ...props,
              }}
            />
          </LegendPopper>
        </Grid>
      </Grid>
    </ToggleButton>
  )
}

const MapFeature = ({ legendGroupId, id, value, ...props }) => {
  const { mapId } = useContext(MapContext)
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const handleChangeVisibility = useMutateStateWithSync(
    (event) => ({
      path: [
        'maps',
        'data',
        mapId,
        'legendGroups',
        legendGroupId,
        'data',
        id,
        'value',
      ],
      value: event.target.checked ?? true,
    }),
    [id, legendGroupId, mapId]
  )

  const LegendRowClass = nodeTypes.includes(id)
    ? LegendRowNode
    : arcTypes.includes(id)
      ? LegendRowArc
      : LegendRowGeo
  return (
    <LegendRowClass
      LegendRowComponent={LegendRow}
      {...{ legendGroupId, id, value, ...props }}
      onChangeVisibility={handleChangeVisibility}
    />
  )
}

const StyledWrapper = (props) => (
  <OptionalWrapper
    component={Paper}
    wrapperProps={{
      component: Stack,
      sx: styles.legendGroup,
      divider: <Divider flexItem />,
    }}
    {...props}
  />
)

const LegendGroup = ({
  legendGroup,
  popperProps: { anchorEl, openId, handleClose, handleOpenById },
}) => {
  const { mapId } = useContext(MapContext)
  const showLegendGroupNames = useSelector(selectShowLegendGroupNames)[mapId]
  const legendGroupData = useMemo(
    () => withIndex(legendGroup.data || {}),
    [legendGroup]
  )

  return (
    <StyledWrapper wrap={showLegendGroupNames}>
      {showLegendGroupNames && (
        <Typography
          sx={{ alignItems: 'center', px: 1, my: 1 }}
          variant="subtitle1"
        >
          {legendGroup.name}
        </Typography>
      )}
      <Stack sx={{ width: '100%' }} divider={<Divider flexItem />}>
        {legendGroupData.map(({ id, value, ...props }) => (
          <MapFeature
            key={id}
            legendGroupId={legendGroup.id}
            anchorEl={id === openId || openId == null ? anchorEl : null}
            onOpen={handleOpenById(id)}
            onClose={handleClose}
            {...{ id, value, ...props }}
          />
        ))}
      </Stack>
    </StyledWrapper>
  )
}

const LegendGroups = (props) => {
  const { mapId } = useContext(MapContext)
  const showLegendGroupNames = useSelector(selectShowLegendGroupNames)[mapId]
  const legendDataRaw = useSelector(selectLegendDataFunc)(mapId)

  const legendData = useMemo(() => withIndex(legendDataRaw), [legendDataRaw])
  const showWrapper = useMemo(() => {
    const isAnyMapFeatureVisible = legendData.some((legendGroup) =>
      Object.values(legendGroup.data).some((mapFeature) => mapFeature.value)
    )
    return !showLegendGroupNames && isAnyMapFeatureVisible
  }, [legendData, showLegendGroupNames])
  return (
    <StyledWrapper wrap={showWrapper}>
      {legendData.map((legendGroup) => (
        <LegendGroup key={legendGroup.id} {...{ legendGroup, ...props }} />
      ))}
    </StyledWrapper>
  )
}

const CompactLegend = () => {
  const popperProps = useLegendPopper()
  return (
    <LegendRoot sx={styles.root} elevation={12}>
      <LegendHeader
        {...{ popperProps }}
        sx={{ my: 0 }}
        slotProps={{
          popper: { sx: { zIndex: 3 } },
          icon: { size: 20 },
        }}
      >
        <LegendSettings />
      </LegendHeader>
      <LegendGroups {...{ popperProps }} />
    </LegendRoot>
  )
}

export default memo(CompactLegend)
