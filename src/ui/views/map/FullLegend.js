import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
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
  useLegend,
  useLegendDetails,
  WithEditBadge,
} from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectLegendDataFunc,
  selectArcTypeKeys,
  selectNodeTypeKeys,
} from '../../../data/selectors'
import { statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import {
  FetchedIcon,
  ShapePicker,
  OverflowText,
  OptionalWrapper,
} from '../../compound'

import { withIndex, getLabelFn } from '../../../utils'

const styles = {
  root: {
    position: 'relative',
    // width: 'auto',
    // maxWidth: '800px',
    width: '700px',
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
    borderWidth: 1,
    borderStyle: 'outset',
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
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
  colorByOptions,
  sizeBy,
  sizeByOptions,
  heightBy,
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
  expanded,
  setExpanded,
  onToggleExpanded,
  getRange,
}) => {
  const [showShapePicker, handleToggleShapePicker] = useToggle(false, true)
  const {
    basePath,
    colorRange,
    sizeRange,
    clusterRange,
    heightRange,
    handleSelectGroupCalc,
    handleSelectProp,
    handleToggleGroup,
    handleChangeColor,
    handleChangeSize,
    handleChangeShape,
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
    colorByOptions,
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
        <AccordionSummary expandIcon={<MdExpandMore size={24} />}>
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

          <Grid2 container spacing={1}>
            {sizeBy != null && (
              <Grid2 size="grow">
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
                  groupCalcValue={groupCalcBySize}
                  onSelectProp={handleSelectProp}
                  onSelectGroupCalc={handleSelectGroupCalc}
                  onChangeSize={handleChangeSize}
                />
              </Grid2>
            )}
            {colorBy != null && (
              <Grid2 size="grow">
                <ColorLegend
                  valueRange={
                    group && clusterRange.color
                      ? clusterRange.color
                      : colorRange
                  }
                  {...{
                    legendGroupId,
                    mapId,
                    group,
                    colorBy,
                    colorByOptions,
                    featureTypeProps,
                  }}
                  groupCalcValue={groupCalcByColor}
                  onSelectProp={handleSelectProp}
                  onSelectGroupCalc={handleSelectGroupCalc}
                  onChangeColor={handleChangeColor}
                />
              </Grid2>
            )}
            {heightBy != null && (
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
                  icon={<FetchedIcon iconName={icon} />}
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

const LegendRow = ({ id, featureTypeData, ...props }) => (
  <LegendRowDetails
    name={getLabelFn(featureTypeData, id)}
    featureTypeProps={featureTypeData[id].props}
    {...{ id, ...props }}
  />
)

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
            setExpanded={(value) => setExpanded(R.assoc(id, value)(expanded))}
            onToggleExpanded={handleToggleExpandedBy(id)}
            {...{ mapId, id, ...props }}
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

const LegendSettings = ({
  expandAll,
  showLegendGroupNames,
  onChangeView,
  onExpandAll,
  onToggleLegendGroupName,
}) => (
  <Stack
    component={Paper}
    elevation={1}
    spacing={1}
    divider={<Divider />}
    sx={[styles.details, styles.settings]}
  >
    <Typography variant="h5" sx={{ textAlign: 'start' }}>
      Settings
    </Typography>
    <FormGroup>
      <FormControlLabel
        value="expand-or-collapse-legend"
        control={
          <Switch
            name="cave-expand-or-collapse-legend"
            checked={expandAll}
            onChange={onExpandAll}
          />
        }
        label="Expand all"
        labelPlacement="end"
      />
      <FormControlLabel
        value="toggle-legend-group-names"
        control={
          <Switch
            name="cave-toggle-legend-group-names"
            checked={showLegendGroupNames}
            onChange={onToggleLegendGroupName}
          />
        }
        label="Show legend group names"
        labelPlacement="end"
      />
    </FormGroup>
    <Button variant="contained" color="warning" onClick={onChangeView}>
      Switch to Minimal View
    </Button>
  </Stack>
)

const FullLegend = ({ mapId, onChangeView }) => {
  const [expandAll, handleExpandAll] = useToggle(true)
  const { showLegendGroupNames, handleToggleLegendGroupNames } =
    useLegend(mapId)
  return (
    <LegendRoot
      {...{ mapId }}
      spacing={showLegendGroupNames ? 0 : 1}
      sx={[styles.root, showLegendGroupNames && { pt: 0, px: 1 }]}
    >
      <LegendHeader
        {...{ mapId }}
        slotProps={{
          label: { variant: 'h5', sx: { pl: 1 } },
          icon: { size: 24 },
        }}
      >
        <LegendSettings
          {...{ expandAll, showLegendGroupNames, onChangeView }}
          onExpandAll={handleExpandAll}
          onToggleLegendGroupName={handleToggleLegendGroupNames}
        />
      </LegendHeader>
      <LegendGroups
        {...{ mapId, expandAll, showLegendGroupNames }}
        onToggleLegendGroupName={handleToggleLegendGroupNames}
      />
    </LegendRoot>
  )
}

export default memo(FullLegend)
