import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Grid2,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { LuGroup, LuUngroup } from 'react-icons/lu'
import { MdExpandMore, MdFilterAlt } from 'react-icons/md'
import { useSelector } from 'react-redux'

import ColorLegend from './ColorLegend'
import HeightLegend from './HeightLegend'
import {
  LegendHeader,
  LegendRoot,
  LegendRowArc,
  LegendRowGeo,
  LegendRowNode,
  useLegendPopper,
  useLegendDetails,
  WithEditBadge,
  LegendSettings,
} from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectLegendDataFunc,
  selectArcTypeKeys,
  selectNodeTypeKeys,
  selectLegendLayoutFunc,
  selectLegendWidthFunc,
  selectShowLegendGroupNamesFunc,
} from '../../../data/selectors'
import { LEGEND_SLIM_WIDTH, LEGEND_WIDE_WIDTH } from '../../../utils/constants'
import { legendLayouts, legendWidths, statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import {
  FetchedIcon,
  ShapePicker,
  OverflowText,
  OptionalWrapper,
} from '../../compound'

import { withIndex } from '../../../utils'

const styles = {
  root: {
    position: 'relative',
    // width: 'auto',
    // maxWidth: '800px',
    width: LEGEND_WIDE_WIDTH,
    p: 1,
    mx: 0,
    color: 'text.primary',
    borderWidth: 2,
    borderStyle: 'outset',
    borderColor: 'grey.500',
    borderRadius: 1,
    boxSizing: 'border-box',
  },
  details: {
    maxHeight: '100%',
    maxWidth: '100%',
    bgcolor: 'grey.800',
    p: 1,
    border: '1px outset rgb(128 128 128)',
    boxSizing: 'border-box',
  },
  settings: {
    overflow: 'auto',
    maxWidth: 'fit-content',
    borderWidth: 2,
    pt: 2,
  },
  toggleButton: {
    p: 1,
    borderRadius: '50%',
  },
  unit: {
    display: 'flex',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
    // Match the built-in padding & font size
    // of the left-side `Dropdown`'s `Button`
    p: '5px 15px',
    fontSize: '0.875rem',
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
  shape,
  // shapeBy, // TODO: `shapeBy` would be a unifying property for `iconBy` and `lineBy`?
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
  expanded,
  setExpanded,
  onToggleExpanded,
  getRange,
}) => {
  const legendLayout = useSelector(selectLegendLayoutFunc)(mapId)
  const [showShapePicker, handleToggleShapePicker] = useToggle(false, true)
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
  // Automatically expand the `Accordion` when the Shape Picker toggle is enabled
  useEffect(() => {
    if (showShapePicker) setExpanded(true)
  }, [setExpanded, showShapePicker])

  const handleChangeVisibility = useMutateStateWithSync(
    (event) => {
      // Sync the `Accordion`'s expanded/collapsed state
      // with the value of the map feature toggle
      const newValue = event.target.checked
      setExpanded(newValue)
      event.stopPropagation()
      return {
        path: [...basePath, 'value'],
        value: newValue ?? true,
      }
    },
    [basePath]
  )
  return (
    <Stack
      component={Paper}
      elevation={1}
      spacing={1}
      sx={[styles.details, { p: 0 }]}
    >
      <Accordion
        disableGutters
        elevation={0}
        {...{ expanded }}
        onChange={onToggleExpanded}
      >
        <AccordionSummary
          component="div"
          expandIcon={<MdExpandMore size={24} />}
        >
          <Grid2
            key={id}
            container
            spacing={1}
            sx={{ alignItems: 'center', width: '100%' }}
          >
            <Grid2 size="auto">
              <Switch
                name={`map-feature-switch-${id}`}
                size="small"
                checked={value}
                onClick={handleChangeVisibility}
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
              <IconButton
                disabled={isFilterDisabled}
                onClick={handleOpenFilter}
              >
                <Badge
                  color={isFilterDisabled ? 'default' : 'info'}
                  badgeContent={numActiveFilters}
                >
                  <MdFilterAlt size={24} />
                </Badge>
              </IconButton>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: 1 }}>
          {/* TODO: Improve location/width of `ShapePicker` */}
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

          <Grid2
            container
            direction={
              legendLayout === legendLayouts.AUTO ||
              legendLayout === legendLayouts.COLUMN
                ? 'row'
                : 'column'
            }
            spacing={1}
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
                  hasAnyNullValue={hasAnyNullValue(colorBy)}
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
                  hasAnyNullValue={hasAnyNullValue(sizeBy)}
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
                  hasAnyNullValue={hasAnyNullValue(heightBy)}
                  icon={<FetchedIcon iconName={icon} />}
                  onChangePropAttr={handleChangePropAttr}
                  onSelectProp={handleSelectProp('heightBy')}
                />
              </Grid2>
            )}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}

const LegendRow = ({ id, mapFeaturesBy, mapId, ...props }) => {
  const mapFeatures = mapFeaturesBy(id, mapId)
  const featureTypeValues = useMemo(
    () => R.pluck('values')(mapFeatures),
    [mapFeatures]
  )
  if (mapFeatures.length === 0) return null

  return (
    <LegendRowDetails
      name={mapFeatures[0].name ?? id}
      featureTypeProps={mapFeatures[0].props}
      {...{ id, mapId, featureTypeValues, ...props }}
    />
  )
}

const MapFeature = ({ id, ...props }) => {
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const LegendRowClass = nodeTypes.includes(id)
    ? LegendRowNode
    : arcTypes.includes(id)
      ? LegendRowArc
      : LegendRowGeo
  return <LegendRowClass LegendRowComponent={LegendRow} {...{ id, ...props }} />
}

const LegendGroup = ({
  expandAll,
  mapId,
  legendGroup,
  showLegendGroupNames,
  legendLayout,
}) => {
  const [
    expandedLegendGroup,
    handleToggleExpandedLegendGroup,
    setExpandedLegendGroup,
  ] = useToggle(true)

  // `expanded` state for all map features (by `id`)
  const [expanded, setExpanded] = useState(
    R.pipe(
      R.keys,
      R.reduce((acc, id) => R.assoc(id, expandAll)(acc), {})
    )(legendGroup.data)
  )

  // Sync the Legend Group's expanded/collapsed
  // state with the "Expand all" setting
  useEffect(() => {
    setExpandedLegendGroup(expandAll)
    setExpanded(R.map(R.always(expandAll)))
  }, [expandAll, setExpandedLegendGroup])

  const handleToggleExpandedBy = useCallback(
    (id) => () => {
      setExpanded(R.assoc(id, !(expanded[id] ?? true)))
    },
    [expanded]
  )

  const legendGroupData = useMemo(
    () => withIndex(legendGroup.data || {}),
    [legendGroup.data]
  )

  return (
    <OptionalWrapper
      component={Accordion}
      wrap={showLegendGroupNames}
      wrapperProps={{
        disableGutters: true,
        expanded: expandedLegendGroup,
        elevation: 1,
        onChange: handleToggleExpandedLegendGroup,
      }}
    >
      {showLegendGroupNames && (
        <OptionalWrapper
          component={AccordionSummary}
          wrap
          wrapperProps={{ expandIcon: <MdExpandMore size={24} /> }}
        >
          <Typography variant="h6">{legendGroup.name}</Typography>
        </OptionalWrapper>
      )}
      <OptionalWrapper
        component={AccordionDetails}
        wrap={showLegendGroupNames}
        wrapperProps={{ sx: { p: 1 } }}
      >
        {legendGroupData.map(({ id, ...props }) => (
          <MapFeature
            key={id}
            legendGroupId={legendGroup.id}
            expanded={expanded[id] ?? true}
            {...{ mapId, id, legendLayout, ...props }}
            setExpanded={(value) => setExpanded(R.assoc(id, value))}
            onToggleExpanded={handleToggleExpandedBy(id)}
          />
        ))}
      </OptionalWrapper>
    </OptionalWrapper>
  )
}

const LegendGroups = ({ mapId, ...props }) => {
  const legendDataRaw = useSelector(selectLegendDataFunc)(mapId)
  const legendData = useMemo(() => withIndex(legendDataRaw), [legendDataRaw])
  const showWrapper = useMemo(() => {
    return !props.showSettings && !props.showLegendGroupNames
  }, [props.showSettings, props.showLegendGroupNames])
  return (
    <OptionalWrapper component="div" wrap={showWrapper}>
      {legendData.map((legendGroup) => (
        <LegendGroup
          key={legendGroup.id}
          {...{ mapId, legendGroup, ...props }}
        />
      ))}
    </OptionalWrapper>
  )
}

const FullLegend = ({ mapId }) => {
  const showLegendGroupNames = useSelector(selectShowLegendGroupNamesFunc)(
    mapId
  )
  const legendWidth = useSelector(selectLegendWidthFunc)(mapId)
  const [expandAll, handleExpandAll] = useToggle(true)
  const [showAdvancedControls, handleToggleAdvancedControls] = useToggle(false)
  const popperProps = useLegendPopper()
  return (
    <LegendRoot
      {...{ mapId }}
      spacing={showLegendGroupNames ? 0 : 1}
      sx={[
        styles.root,
        showLegendGroupNames && { pt: 0, px: 1 },
        legendWidth === legendWidths.SLIM && { width: LEGEND_SLIM_WIDTH },
      ]}
    >
      <LegendHeader
        {...{ mapId, popperProps }}
        slotProps={{
          label: { variant: 'h5', sx: { pl: 1 } },
          icon: { size: 24 },
        }}
      >
        <LegendSettings
          {...{
            mapId,
            expandAll,
            showAdvancedControls,
          }}
          onExpandAll={handleExpandAll}
          onToggleAdvancedControls={handleToggleAdvancedControls}
        />
      </LegendHeader>
      <LegendGroups {...{ mapId, expandAll, showLegendGroupNames }} />
    </LegendRoot>
  )
}

export default memo(FullLegend)
