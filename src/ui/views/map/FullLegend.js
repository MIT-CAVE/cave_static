import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Button,
  Grid2,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import { memo, useState, useMemo } from 'react'
import { LuGroup, LuUngroup } from 'react-icons/lu'
import { MdExpandMore, MdFilterAlt } from 'react-icons/md'
import { useSelector } from 'react-redux'

import ColorLegend from './ColorLegend'
import HeightLegend from './HeightLegend'
import { LegendHeader, LegendRoot, useLegend, useLegendDetails } from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectGeoRange,
  selectNodeRange,
  selectArcRange,
  selectLegendDataFunc,
  selectLocalizedArcTypes,
  selectLocalizedNodeTypes,
  selectLocalizedGeoTypes,
  selectArcTypeKeys,
  selectNodeTypeKeys,
  selectSettingsIconUrl,
} from '../../../data/selectors'
import { statId } from '../../../utils/enums'
import { useMutateStateWithSync, useToggle } from '../../../utils/hooks'
import { EnhancedListbox, useIconDataLoader } from '../../compound/ShapePicker'
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
    width: '600px',
    p: (theme) => theme.spacing(0, 1, 1),
    mx: 0,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: 2,
    borderColor: (theme) => theme.palette.grey[500],
    borderStyle: 'outset',
    borderRadius: 1,
  },
  details: {
    maxHeight: '100%',
    maxWidth: '100%',
    p: 1.5,
    border: 1,
    boxSizing: 'border-box',
    borderColor: 'rgb(128, 128, 128)',
    // borderColor: (theme) => theme.palette.primary.main,
    borderStyle: 'outset',
  },
  toggleGroup: {
    p: 1,
    borderRadius: '50%',
  },
  unit: {
    display: 'flex',
    justifyContent: 'center',
    border: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
    // Match the built-in padding & font size
    // of the left-side `Dropdown`'s `Button`
    p: '5px 15px',
    fontSize: '0.875rem',
  },
}

const LegendRow = ({
  mapId,
  legendGroupId,
  id,
  icon,
  shape,
  shapeLabel,
  shapePathEnd,
  shapeOptions,
  ListboxComponent,
  groupBy,
  getShapeIcon,
  getShapeLabel,
  featureTypeData,
  allowGrouping,
  colorBy,
  colorByOptions,
  sizeBy,
  sizeByOptions,
  heightBy,
  heightByOptions,
  group,
  groupCalcByColor = statId.COUNT,
  groupCalcBySize = statId.COUNT,
  value: isVisible,
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
  getRange,
}) => {
  const [showShapePicker, handleToggleShapePicker] = useToggle(false)

  const featureTypeProps = featureTypeData[id].props

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

  const name = getLabelFn(featureTypeData, id)

  const handleChangeVisibility = useMutateStateWithSync(
    (event) => ({
      path: [...basePath, 'value'],
      value: event.target.checked ?? true,
    }),
    [basePath]
  )
  return (
    <Stack component={Paper} elevation={1} spacing={1} sx={styles.details}>
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
            checked={isVisible}
            onClick={handleChangeVisibility}
          />
        </Grid2>
        <Grid2 size="auto">
          <OptionalWrapper
            component={ToggleButton}
            wrap={shapeOptions != null}
            wrapperProps={{
              value: 'shape',
              sx: { p: 1, borderRadius: '50%' },
              onClick: handleToggleShapePicker,
            }}
          >
            <FetchedIcon iconName={icon} size={24} />
          </OptionalWrapper>
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
              sx={styles.toggleGroup}
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
              <MdFilterAlt size={24} />
            </Badge>
          </IconButton>
        </Grid2>
      </Grid2>

      {/* TODO: Improve location/width of `ShapePicker` */}
      {showShapePicker && (
        <ShapePicker
          {...{ groupBy, ListboxComponent }}
          value={shape}
          label={shapeLabel}
          options={shapeOptions}
          getIcon={getShapeIcon}
          getLabel={getShapeLabel}
          onChange={handleChangeShape}
        />
      )}

      <Stack direction="row" spacing={1} sx={{ overflow: 'auto' }}>
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
            groupCalcValue={groupCalcBySize}
            onSelectProp={handleSelectProp}
            onSelectGroupCalc={handleSelectGroupCalc}
            onChangeSize={handleChangeSize}
          />
        )}
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
            groupCalcValue={groupCalcByColor}
            onSelectProp={handleSelectProp}
            onSelectGroupCalc={handleSelectGroupCalc}
            onChangeColor={handleChangeColor}
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
            icon={<FetchedIcon iconName={icon} />}
            onSelectProp={handleSelectProp('heightBy')}
          />
        )}
      </Stack>
    </Stack>
  )
}

const LegendRowNode = (props) => {
  const [options, setOptions] = useState([])
  const nodeTypes = useSelector(selectLocalizedNodeTypes)
  const getRange = useSelector(selectNodeRange)
  const iconUrl = useSelector(selectSettingsIconUrl)
  useIconDataLoader(iconUrl, setOptions, console.error)
  return (
    <LegendRow
      featureTypeData={nodeTypes}
      shapeOptions={options}
      shapePathEnd="icon"
      shape={props.icon}
      shapeLabel="Search available icons"
      getShapeIcon={(option) => option}
      getShapeLabel={(option) => option?.split('/')[1]}
      ListboxComponent={EnhancedListbox}
      // TODO: Implement groups
      // groupBy={(option) => option?.split('/')[0]}
      {...{ getRange, ...props }}
    />
  )
}

const LegendRowArc = (props) => {
  const arcTypes = useSelector(selectLocalizedArcTypes)
  const getRange = useSelector(selectArcRange)
  const indexedOptions = {
    solid: { icon: 'ai/AiOutlineLine', label: 'Solid' },
    dotted: { icon: 'ai/AiOutlineEllipsis', label: 'Dotted' },
    dashed: { icon: 'ai/AiOutlineDash', label: 'Dashed' },
    // '3d': { icon: 'vsc/VscLoading', label: 'Arc' },
  }
  return (
    <LegendRow
      featureTypeData={arcTypes}
      shapeOptions={Object.keys(indexedOptions)}
      shapePathEnd="lineBy"
      shape={props.lineBy ?? 'solid'}
      icon={indexedOptions[props.lineBy ?? 'solid']?.icon}
      shapeLabel="Select the line style"
      getShapeIcon={(option) => indexedOptions[option]?.icon}
      getShapeLabel={(option) => indexedOptions[option]?.label}
      {...{ getRange, ...props }}
    />
  )
}

const LegendRowGeo = (props) => {
  const geoTypes = useSelector(selectLocalizedGeoTypes)
  const getRange = useSelector(selectGeoRange)
  return <LegendRow featureTypeData={geoTypes} {...{ getRange, ...props }} />
}

const MapFeature = ({ id, ...props }) => {
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const LegendRowClass = nodeTypes.includes(id)
    ? LegendRowNode
    : arcTypes.includes(id)
      ? LegendRowArc
      : LegendRowGeo
  return <LegendRowClass {...{ id, ...props }} />
}

const LegendGroup = ({
  mapId,
  legendGroup,
  showDisabledFeatures = true, // QUESTION: Should this be always `true` or should we make it a legend setting?
  showLegendGroupNames,
}) => {
  const legendGroupData = useMemo(
    () => withIndex(legendGroup.data || {}),
    [legendGroup]
  )
  const isAnyMapFeatureVisible = useMemo(
    () => showDisabledFeatures || legendGroupData.some(({ value }) => value),
    [legendGroupData, showDisabledFeatures]
  )
  return isAnyMapFeatureVisible ? (
    <OptionalWrapper
      component={Accordion}
      wrap={showLegendGroupNames}
      wrapperProps={{
        elevation: 2,
        disableGutters: true,
        defaultExpanded: true,
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
      <OptionalWrapper component={AccordionDetails} wrap={showLegendGroupNames}>
        {legendGroupData.map(({ id, value, ...props }) =>
          value || showDisabledFeatures ? (
            <MapFeature
              key={id}
              legendGroupId={legendGroup.id}
              {...{ mapId, id, value, ...props }}
            />
          ) : null
        )}
      </OptionalWrapper>
    </OptionalWrapper>
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

// TODO: This might just be triggered as a menu
const LegendSettings = ({ onChangeView, ...props }) => (
  <Stack>
    {/* <LegendGroups showSettings {...{ mapId, ...props }} /> */}
    <Button
      variant="contained"
      color="warning"
      sx={{ mt: 1.5 }}
      onClick={onChangeView}
    >
      Switch to Minimal View
    </Button>
  </Stack>
)

const FullLegend = ({ mapId, onChangeView }) => {
  const {
    showSettings,
    showLegendGroupNames,
    handleToggleLegendGroupNames,
    handleToggleSettings,
  } = useLegend(mapId)
  return (
    <LegendRoot {...{ mapId }} sx={styles.root}>
      <LegendHeader
        label="Legend"
        labelProps={{ variant: 'h5' }}
        iconProps={{ size: 'large' }}
        {...{ showSettings }}
        onToggleSettings={handleToggleSettings}
      />
      {showSettings ? (
        <LegendSettings
          {...{ mapId, showLegendGroupNames, onChangeView }}
          onToggleLegendGroupName={handleToggleLegendGroupNames}
        />
      ) : (
        <LegendGroups
          {...{ mapId, showLegendGroupNames }}
          onToggleLegendGroupName={handleToggleLegendGroupNames}
        />
      )}
    </LegendRoot>
  )
}

export default memo(FullLegend)
