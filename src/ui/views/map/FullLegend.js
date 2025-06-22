import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { LuGroup, LuRadius, LuUngroup } from 'react-icons/lu'
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
  GroupScaleControls,
} from './Legend'
import SizeLegend from './SizeLegend'
import { MapContext } from './useMapApi'
import useMapFilter from './useMapFilter'

import {
  selectLegendDataFunc,
  selectArcTypeKeys,
  selectNodeTypeKeys,
  selectLegendLayout,
  selectLegendWidth,
  selectShowLegendGroupNames,
  selectShowLegendAdvancedControls,
} from '../../../data/selectors'
import { LEGEND_SLIM_WIDTH, LEGEND_WIDE_WIDTH } from '../../../utils/constants'
import { legendLayouts, legendWidths, statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { useSizeSlider } from '../../compound/SizeSlider'
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
  groupScale = 50,
  groupScaleWithZoom = false,
  groupCalcByColor = statId.COUNT,
  groupCalcBySize = statId.COUNT,
  filters,
  featureTypeProps,
  featureTypeValues,
  expanded,
  setExpandedBy,
  onToggleExpanded,
  getRange,
}) => {
  const { mapId } = useContext(MapContext)
  const legendLayout = useSelector(selectLegendLayout)[mapId]
  const showLegendAdvancedControls = useSelector(
    selectShowLegendAdvancedControls
  )[mapId]
  const [showShapePicker, handleToggleShapePicker] = useToggle(false, true)
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
    legendLayout === legendLayouts.AUTO || legendLayout === legendLayouts.COLUMN
      ? 'row'
      : 'column'

  // Expand the Accordion when Shape Picker or Scale Group is enabled
  useEffect(() => {
    if (showShapePicker || showGroupControls) setExpandedBy(id, true)
  }, [showGroupControls, setExpandedBy, showShapePicker, id])

  const handleChangeVisibility = useMutateStateWithSync(
    (event) => {
      // Sync the `Accordion`'s expanded/collapsed state
      // with the value of the map feature toggle
      const newValue = event.target.checked
      setExpandedBy(id, newValue)
      event.stopPropagation()
      return { path: [...basePath, 'value'], value: newValue ?? true }
    },
    [basePath]
  )

  const handleToggleGroup = useCallback(
    (event, value) => {
      if (value) groupScaleSlider.handleClose(event) // Close the Scale Group when grouping is disabled
      handleToggleGroupRaw(event, value)
    },
    [handleToggleGroupRaw, groupScaleSlider]
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
          <Grid
            key={id}
            container
            spacing={1}
            sx={{ alignItems: 'center', width: '100%' }}
          >
            <Grid size="auto">
              <Switch
                name={`map-feature-switch-${id}`}
                size="small"
                checked={value}
                onClick={handleChangeVisibility}
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
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: 1 }}>
          {/* TODO: Improve location/width of `ShapePicker` */}
          <Stack useFlexGap spacing={1} sx={{ mb: 1 }}>
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

            {showLegendAdvancedControls && showGroupControls && (
              <GroupScaleControls
                {...{ groupScaleWithZoom, ...groupScaleSlider }}
                onChangeLegendAttr={handleChangeLegendAttr}
              />
            )}
          </Stack>

          <Grid container direction={layoutDirection} spacing={1}>
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
                  hasAnyNullValue={hasAnyNullValue(colorBy)}
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
                  hasAnyNullValue={hasAnyNullValue(sizeBy)}
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
                  hasAnyNullValue={hasAnyNullValue(heightBy)}
                  icon={<FetchedIcon iconName={icon} />}
                  onChangePropAttr={handleChangePropAttr}
                  onSelectProp={handleSelectProp('heightBy')}
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}

const LegendRow = ({ id, mapFeaturesBy, ...props }) => {
  const { mapId } = useContext(MapContext)
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
      {...{ id, featureTypeValues, ...props }}
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

  const setExpandedBy = useCallback(
    (id, value) => setExpanded(R.assoc(id, value)),
    [setExpanded]
  )

  const handleToggleExpandedBy = useCallback(
    (id) => () => {
      setExpanded(
        R.converge(R.assoc(id), [
          R.pipe(R.prop(id), R.defaultTo(true), R.not),
          R.identity,
        ])
      )
    },
    []
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
            onToggleExpanded={handleToggleExpandedBy(id)}
            // Unlike `expanded` and `onToggleExpanded` where `id` is
            // embedded, `setExpandedBy` is passed as is to avoid an
            // infinite loop on `LegendRowDetails`'s `useEffect`.
            {...{ id, legendLayout, setExpandedBy, ...props }}
          />
        ))}
      </OptionalWrapper>
    </OptionalWrapper>
  )
}

const LegendGroups = (props) => {
  const { mapId } = useContext(MapContext)
  const legendDataRaw = useSelector(selectLegendDataFunc)(mapId)
  const legendData = useMemo(() => withIndex(legendDataRaw), [legendDataRaw])
  const showWrapper = useMemo(() => {
    return !props.showSettings && !props.showLegendGroupNames
  }, [props.showSettings, props.showLegendGroupNames])
  return (
    <OptionalWrapper component="div" wrap={showWrapper}>
      {legendData.map((legendGroup) => (
        <LegendGroup key={legendGroup.id} {...{ legendGroup, ...props }} />
      ))}
    </OptionalWrapper>
  )
}

const FullLegend = () => {
  const { mapId } = useContext(MapContext)
  const showLegendGroupNames = useSelector(selectShowLegendGroupNames)[mapId]
  const legendWidth = useSelector(selectLegendWidth)[mapId]
  const [expandAll, handleExpandAll] = useToggle(true)
  const popperProps = useLegendPopper()
  return (
    <LegendRoot
      spacing={showLegendGroupNames ? 0 : 1}
      sx={[
        styles.root,
        showLegendGroupNames && { pt: 0, px: 1 },
        legendWidth === legendWidths.SLIM && { width: LEGEND_SLIM_WIDTH },
      ]}
    >
      <LegendHeader
        {...{ popperProps }}
        slotProps={{
          label: { variant: 'h5', sx: { pl: 1 } },
          icon: { size: 24 },
        }}
      >
        <LegendSettings {...{ expandAll }} onExpandAll={handleExpandAll} />
      </LegendHeader>
      <LegendGroups {...{ expandAll, showLegendGroupNames }} />
    </LegendRoot>
  )
}

export default memo(FullLegend)
