import {
  Badge,
  Button,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import { Fragment, memo, useMemo } from 'react'
import { BiDetail } from 'react-icons/bi'
import { LuGroup, LuUngroup } from 'react-icons/lu'
import {
  MdFilterAlt,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import ColorLegend from './ColorLegend'
import HeightLegend from './HeightLegend'
import {
  LegendHeader,
  LegendRoot,
  useLegend,
  useLegendDetails,
  WithEditBadge,
  LegendRowNode,
  LegendRowArc,
  LegendRowGeo,
  LegendPopper,
} from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectArcTypeKeys,
  selectLegendDataFunc,
  selectNodeTypeKeys,
} from '../../../data/selectors'
import { statId } from '../../../utils/enums'
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
    py: 0.75,
    border: '1px outset rgb(128 128 128)',
  },
  details: {
    maxHeight: '100%',
    maxWidth: '100%',
    bgcolor: 'grey.800',
    p: 1,
    border: '1px outset rgb(128 128 128)',
    boxSizing: 'border-box',
    // borderColor: (theme) => theme.palette.primary.main,
  },
  settings: {
    overflow: 'auto',
    maxWidth: 'fit-content',
    borderWidth: 2,
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
  filters = [
    {
      id: 0,
      type: 'group',
      groupId: 0,
      logic: 'and',
      depth: 0,
      edit: false,
    },
  ],
  featureTypeProps,
  featureTypeValues,
  getRange,
  onChangeVisibility,
}) => {
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
      <Stack spacing={1} sx={{ overflow: 'auto' }}>
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
            anyNullValue={hasAnyNullValue(colorBy)}
            groupCalcValue={groupCalcByColor}
            onSelectProp={handleSelectProp}
            onSelectGroupCalc={handleSelectGroupCalc}
            onChangePropAttr={handleChangePropAttr}
            onChangeColor={handleChangeColor}
          />
        )}
        {sizeBy != null && (
          <SizeLegend
            valueRange={
              group && clusterRange.size ? clusterRange.size : sizeRange
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
        )}
        {/* FIXME: `heightBy` is temporarily hidden */}
        {heightBy != null && false && (
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
        )}
      </Stack>
    </Stack>
  )
}

const LegendRow = ({ mapId, id, mapFeaturesBy, showSettings, ...props }) => {
  const mapFeatures = mapFeaturesBy(id, mapId)
  const name = mapFeatures[0].name ?? id
  const numActiveFilters = useMemo(
    () => getNumActiveFilters(props.filters),
    [props.filters]
  )
  const featureTypeValues = useMemo(
    () => mapFeatures.map((feature) => feature.values),
    [mapFeatures]
  )
  return (
    <Grid2
      key={id}
      container
      spacing={1}
      sx={{ alignItems: 'center', width: '100%', px: 1 }}
    >
      {showSettings && (
        <Grid2 size="auto">
          <Switch
            name={`cave-toggle-map-${id}`}
            size="small"
            checked={props.value}
            onClick={props.onChangeVisibility}
          />
        </Grid2>
      )}
      <Grid2 size="auto">
        <FetchedIcon size={16} iconName={props.icon} />
      </Grid2>
      <Grid2 size="grow" sx={{ textAlign: 'start' }}>
        <Typography variant="caption">{name}</Typography>
      </Grid2>
      {!showSettings && (
        <Grid2 size="auto">
          <LegendPopper
            {...{ mapId }}
            IconComponent={BiDetail}
            slotProps={{
              badge: {
                showBadge: numActiveFilters > 0,
                overlap: 'rectangular',
                size: 14,
                color: '#29b6f6',
                reactIcon: () => <MdFilterAlt color="#4a4a4a" />,
                sx: { right: 0, top: 0 },
              },
              popper: { sx: { width: '400px' } },
            }}
          >
            <LegendRowDetails
              featureTypeProps={mapFeatures[0].props}
              {...{ mapId, id, name, featureTypeValues, ...props }}
            />
          </LegendPopper>
        </Grid2>
      )}
    </Grid2>
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
    wrapperProps={{ component: Stack, spacing: 0.5, sx: styles.legendGroup }}
    {...props}
  />
)

const LegendGroup = ({
  mapId,
  legendGroup,
  showSettings,
  showLegendGroupNames,
  onToggleLegendGroupName,
}) => {
  const legendGroupData = useMemo(
    () => withIndex(legendGroup.data || {}),
    [legendGroup]
  )
  const isAnyMapFeatureVisible = useMemo(
    () => showSettings || legendGroupData.some(({ value }) => value),
    [legendGroupData, showSettings]
  )
  const isLegendGroupNameVisible = showSettings || showLegendGroupNames

  return isAnyMapFeatureVisible ? (
    <StyledWrapper wrap={isLegendGroupNameVisible}>
      {isLegendGroupNameVisible && (
        <>
          <Grid2 container spacing={1} sx={{ alignItems: 'center', px: 1 }}>
            {showSettings && (
              <Grid2 size="auto">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={onToggleLegendGroupName}
                >
                  {showLegendGroupNames ? (
                    <MdOutlineVisibility />
                  ) : (
                    <MdOutlineVisibilityOff />
                  )}
                </IconButton>
              </Grid2>
            )}
            <Grid2 size="grow">
              <Typography variant="subtitle1">{legendGroup.name}</Typography>
            </Grid2>
          </Grid2>
          <Divider sx={{ width: '100%', mb: '2px !important' }} />
        </>
      )}
      {legendGroupData.map(({ id, value, ...props }) =>
        value || showSettings ? (
          <MapFeature
            key={id}
            legendGroupId={legendGroup.id}
            {...{ mapId, id, value, showSettings, ...props }}
          />
        ) : null
      )}
    </StyledWrapper>
  ) : null
}

const LegendGroups = ({ mapId, ...props }) => {
  const legendDataRaw = useSelector(selectLegendDataFunc)(mapId)
  const legendData = useMemo(() => withIndex(legendDataRaw), [legendDataRaw])
  const showWrapper = useMemo(() => {
    const isAnyMapFeatureVisible = legendData.some((legendGroup) =>
      Object.values(legendGroup.data).some((mapFeature) => mapFeature.value)
    )
    return (
      !props.showSettings &&
      !props.showLegendGroupNames &&
      isAnyMapFeatureVisible
    )
  }, [legendData, props.showSettings, props.showLegendGroupNames])
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

const LegendSettings = ({ mapId, onChangeView, ...props }) => (
  <Stack
    component={Paper}
    elevation={1}
    spacing={1}
    sx={[styles.details, styles.settings]}
  >
    <Typography variant="h6" sx={{ textAlign: 'start' }}>
      Settings
    </Typography>
    <LegendGroups showSettings {...{ mapId, ...props }} />
    <Button variant="contained" color="warning" onClick={onChangeView}>
      Switch to Full View
    </Button>
  </Stack>
)

const MinimalLegend = ({ mapId, onChangeView }) => {
  const { showLegendGroupNames, handleToggleLegendGroupNames } =
    useLegend(mapId)
  return (
    <LegendRoot sx={styles.root} elevation={12} {...{ mapId }}>
      <LegendHeader
        {...{ mapId }}
        slotProps={{
          popper: { sx: { zIndex: 3 } },
          icon: { size: 16 },
        }}
      >
        <LegendSettings
          {...{ mapId, showLegendGroupNames, onChangeView }}
          onToggleLegendGroupName={handleToggleLegendGroupNames}
        />
      </LegendHeader>
      <LegendGroups
        {...{ mapId, showLegendGroupNames }}
        onToggleLegendGroupName={handleToggleLegendGroupNames}
      />
    </LegendRoot>
  )
}

export default memo(MinimalLegend)
