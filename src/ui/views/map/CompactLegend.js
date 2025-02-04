import {
  Badge,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useMemo } from 'react'
import { LuGroup, LuUngroup } from 'react-icons/lu'
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
} from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectArcTypeKeys,
  selectLegendDataFunc,
  selectLegendLayoutFunc,
  selectLegendWidthFunc,
  selectNodeTypeKeys,
  selectShowLegendGroupNamesFunc,
} from '../../../data/selectors'
import { LEGEND_SLIM_WIDTH, LEGEND_WIDE_WIDTH } from '../../../utils/constants'
import { legendLayouts, legendWidths, statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
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
}

const LegendRowDetails = ({
  mapId,
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
  ListboxComponent,
  groupBy,
  getShapeIcon,
  getShapeLabel,
  group,
  groupCalcByColor = statId.COUNT,
  groupCalcBySize = statId.COUNT,
  filters,
  featureTypeProps,
  featureTypeValues,
  getRange,
  onChangeVisibility,
}) => {
  const legendLayout = useSelector(selectLegendLayoutFunc)(mapId)
  const [showShapePicker, handleToggleShapePicker] = useToggle(false)
  const {
    basePath,
    colorRange,
    sizeRange,
    clusterRange,
    heightRange,
    hasAnyNullValue,
    handleSelectGroupCalc,
    handleSelectProp,
    handleToggleGroup,
    handleChangeColor,
    handleChangeSize,
    handleChangeShape,
    handleChangePropAttr,
  } = useLegendDetails({
    mapId,
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
    mapId,
    group,
    featureTypeProps,
    filtersPath: [...basePath, 'filters'],
    filters,
  })
  const layoutDirection =
    legendLayout === legendLayouts.AUTO || legendLayout === legendLayouts.ROW
      ? 'column'
      : 'row'
  return (
    <Stack component={Paper} elevation={1} spacing={1} sx={styles.details}>
      <Grid2 container sx={{ alignItems: 'center' }} spacing={1}>
        <Grid2 size="auto">
          <Switch
            name="map-feature-switch"
            size="small"
            checked={value}
            onClick={onChangeVisibility}
          />
        </Grid2>
        <Grid2 size="auto">
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
        </Grid2>
        <Grid2 size="grow">
          <Typography variant="subtitle1" sx={{ textAlign: 'start' }}>
            <OverflowText text={name} />
          </Typography>
        </Grid2>
        <Grid2 size="auto">
          {allowGrouping && (
            <ToggleButton
              color={group ? 'primary' : null}
              selected={group}
              value={group}
              sx={styles.toggleButton}
              onClick={handleToggleGroup}
            >
              {group ? <LuGroup size={24} /> : <LuUngroup size={24} />}
            </ToggleButton>
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
        </Grid2>
      </Grid2>
      {showShapePicker && (
        <ShapePicker
          label={shapeLabel}
          value={shape}
          options={shapeOptions}
          color="warning"
          {...{ ListboxComponent, groupBy }}
          getIcon={getShapeIcon}
          getLabel={getShapeLabel}
          onChange={handleChangeShape}
        />
      )}
      <Divider sx={{ mx: -1.5 }} />
      <Grid2
        container
        direction={layoutDirection}
        spacing={1}
        sx={{ overflow: 'auto' }}
        wrap={layoutDirection === 'row' ? 'wrap' : 'nowrap'}
      >
        {colorBy != null && (
          <Grid2 size="grow">
            <ColorLegend
              valueRange={
                group && clusterRange.color
                  ? R.mergeDeepLeft(clusterRange.color, colorRange)
                  : colorRange
              }
              {...{
                mapId,
                group,
                colorBy,
                colorByOptions,
                featureTypeProps,
              }}
              anyNullValue={hasAnyNullValue(colorBy)}
              groupCalcValue={groupCalcByColor}
              onSelectProp={handleSelectProp}
              onSelectGroupCalc={handleSelectGroupCalc}
              onChangePropAttr={handleChangePropAttr}
              onChangeColor={handleChangeColor}
            />
          </Grid2>
        )}
        {sizeBy != null && (
          <Grid2 size="grow">
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
              onSelectGroupCalc={handleSelectGroupCalc}
              onChangePropAttr={handleChangePropAttr}
              onChangeSize={handleChangeSize}
            />
          </Grid2>
        )}
        {/* FIXME: `heightBy` is temporarily hidden */}
        {heightBy != null && false && (
          <Grid2 size="grow">
            <HeightLegend
              valueRange={heightRange}
              {...{
                legendGroupId,
                mapId,
                heightBy,
                heightByOptions,
                featureTypeProps,
              }}
              anyNullValue={hasAnyNullValue(heightBy)}
              icon={<FetchedIcon iconName={icon} />}
              onChangePropAttr={handleChangePropAttr}
              onSelectProp={handleSelectProp('heightBy')}
            />
          </Grid2>
        )}
      </Grid2>
    </Stack>
  )
}

const LegendRow = ({ mapFeaturesBy, anchorEl, onOpen, onClose, ...props }) => {
  const {
    mapId,
    id,
    group,
    icon,
    colorBy,
    filters,
    getRange,
    onChangeVisibility,
  } = props
  const legendWidth = useSelector(selectLegendWidthFunc)(mapId)

  const mapFeatures = mapFeaturesBy(id, mapId)
  const firstFeature = mapFeatures[0] ?? {}
  const featureTypeProps = mapFeatures[0].props
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
      <Grid2
        key={id}
        container
        spacing={1}
        sx={{ alignItems: 'center', width: '100%' }}
      >
        <Grid2 size="auto">
          <Switch
            name={`cave-toggle-map-${id}`}
            size="small"
            checked={props.value}
            onClick={handleChangeVisibility}
          />
        </Grid2>
        <Grid2 size="auto">
          <FetchedIcon iconName={icon} size={20} />
        </Grid2>
        <Grid2 size="grow" sx={{ textAlign: 'start' }}>
          <Typography variant="caption">{name}</Typography>
        </Grid2>
        <Grid2 size="auto">
          <LegendPopper
            {...{ mapId, anchorEl, onClose }}
            IconComponent={() => (
              <LegendColorMarker
                colorByProp={featureTypeProps[colorBy]}
                anyNullValue={hasAnyNullValue(colorBy)}
                {...{ mapId, id, group, colorBy, getRange }}
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
        </Grid2>
      </Grid2>
    </ToggleButton>
  )
}

const MapFeature = ({ mapId, legendGroupId, id, value, ...props }) => {
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
      {...{ mapId, legendGroupId, id, value, ...props }}
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
  mapId,
  legendGroup,
  popperProps: { anchorEl, openId, handleClose, handleOpenById },
}) => {
  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )
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
      <Stack divider={<Divider flexItem />}>
        {legendGroupData.map(({ id, value, ...props }) => (
          <MapFeature
            key={id}
            legendGroupId={legendGroup.id}
            anchorEl={id === openId || openId == null ? anchorEl : null}
            onOpen={handleOpenById(id)}
            onClose={handleClose}
            {...{ mapId, id, value, ...props }}
          />
        ))}
      </Stack>
    </StyledWrapper>
  )
}

const LegendGroups = ({ mapId, ...props }) => {
  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )
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
        <LegendGroup
          key={legendGroup.id}
          {...{ mapId, legendGroup, ...props }}
        />
      ))}
    </StyledWrapper>
  )
}

const CompactLegend = ({ mapId }) => {
  const popperProps = useLegendPopper()
  return (
    <LegendRoot sx={styles.root} elevation={12} {...{ mapId }}>
      <LegendHeader
        {...{ mapId, popperProps }}
        sx={{ my: 0 }}
        slotProps={{
          popper: { sx: { zIndex: 3 } },
          icon: { size: 20 },
        }}
      >
        <LegendSettings {...{ mapId }} />
      </LegendHeader>
      <LegendGroups {...{ mapId, popperProps }} />
    </LegendRoot>
  )
}

export default memo(CompactLegend)
