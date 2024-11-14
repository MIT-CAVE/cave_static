import {
  Badge,
  Button,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Popper,
  Portal,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import { Fragment, memo, useContext, useMemo, useState } from 'react'
import { LuGroup, LuUngroup } from 'react-icons/lu'
import {
  MdFilterAlt,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md'
import { PiInfo } from 'react-icons/pi'
import { useSelector } from 'react-redux'

import ColorLegend from './ColorLegend'
import HeightLegend from './HeightLegend'
import {
  MapContainerContext,
  LegendHeader,
  LegendRoot,
  useLegend,
  useLegendDetails,
} from './Legend'
import SizeLegend from './SizeLegend'
import useMapFilter from './useMapFilter'

import {
  selectArcRange,
  selectArcTypeKeys,
  selectBearingSliderToggleFunc,
  selectGeoRange,
  selectLegendDataFunc,
  selectLocalizedArcTypes,
  selectLocalizedGeoTypes,
  selectLocalizedNodeTypes,
  selectNodeRange,
  selectNodeTypeKeys,
  selectPitchSliderToggleFunc,
  selectSettingsIconUrl,
} from '../../../data/selectors'
import { statId } from '../../../utils/enums'
import {
  useMenu,
  useMutateStateWithSync,
  useToggle,
} from '../../../utils/hooks'
import ShapePicker, {
  EnhancedListbox,
  useIconDataLoader,
} from '../../compound/ShapePicker'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import { FetchedIcon, OptionalWrapper, OverflowText } from '../../compound'

import { getLabelFn, withIndex } from '../../../utils'

const styles = {
  root: {
    width: 'auto',
    minWidth: '120px',
    maxWidth: '600px',
    p: (theme) => theme.spacing(0, 1, 1),
    mx: 0,
    color: 'text.primary',
    border: 2,
    borderColor: (theme) => theme.palette.grey[500],
    borderStyle: 'outset',
    borderRadius: 1,
  },
  legendGroup: {
    alignItems: 'start',
    mt: 1,
    px: 1,
    py: 0.5,
    border: 1,
    borderColor: 'rgb(128, 128, 128)',
    borderStyle: 'outset',
  },
  legendSection: {
    width: '100%',
    p: 1,
    pt: 2,
    boxSizing: 'border-box',
  },
  popper: {
    height: '100%',
    width: '400px',
    overflow: 'hidden',
    zIndex: 2,
  },
  popperContent: {
    maxHeight: '100%',
    maxWidth: '100%',
    p: 1.5,
    border: 1,
    boxSizing: 'border-box',
    borderColor: 'rgb(128, 128, 128)',
    // borderColor: (theme) => theme.palette.primary.main,
    borderStyle: 'outset',
  },
  categoryRoot: {
    width: '100%',
    mt: 1,
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
    border: 1,
    px: 1,
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
  },
  toggleGroup: {
    p: 1,
    borderRadius: '50%',
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
    width: '100%',
    height: '24px',
    minWidth: '80px',
    backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
  }),
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
  getRange,
  onChangeVisibility,
}) => {
  const [selected, handleToggleSelected] = useToggle(false)
  const [showShapePicker, handleToggleShapePicker] = useToggle(false)
  const containerRef = useContext(MapContainerContext)
  const showPitchSlider = useSelector(selectPitchSliderToggleFunc)(mapId)
  const showBearingSlider = useSelector(selectBearingSliderToggleFunc)(mapId)

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

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

  return (
    <ToggleButton
      size="small"
      color="primary"
      value="details"
      {...{ selected }}
      onMouseEnter={handleOpenMenu}
      onMouseLeave={selected ? null : handleCloseMenu}
      onClick={handleToggleSelected}
    >
      <Badge color="info" variant="dot" invisible={numActiveFilters < 1}>
        <PiInfo />
      </Badge>
      <Portal container={() => (containerRef ? containerRef.current : null)}>
        <Popper
          {...{ anchorEl }}
          placement="left"
          disablePortal
          sx={[
            styles.popper,
            {
              maxHeight: showBearingSlider
                ? 'calc(100% - 165px)'
                : 'calc(100% - 88px)',
              maxWidth: showPitchSlider
                ? 'calc(100% - 164px)'
                : 'calc(100% - 128px)',
            },
          ]}
          open={Boolean(anchorEl) || selected}
          onClose={handleCloseMenu}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Stack
            component={Paper}
            elevation={1}
            spacing={1}
            sx={styles.popperContent}
          >
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
                <IconButton
                  disabled={isFilterDisabled}
                  onClick={handleOpenFilter}
                >
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
                {...{ groupBy, ListboxComponent }}
                value={shape}
                label={shapeLabel}
                options={shapeOptions}
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
                  groupCalcValue={groupCalcBySize}
                  onSelectProp={handleSelectProp}
                  onSelectGroupCalc={handleSelectGroupCalc}
                  onChangeSize={handleChangeSize}
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
        </Popper>
      </Portal>
    </ToggleButton>
  )
}

const LegendRow = ({ id, featureTypeData, showSettings, ...props }) => {
  const name = getLabelFn(featureTypeData, id)
  return (
    <Grid2
      key={id}
      container
      spacing={1}
      sx={{ alignItems: 'center', width: '100%' }}
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
        <FetchedIcon iconName={props.icon} />
      </Grid2>
      <Grid2 size="grow" sx={{ textAlign: 'start' }}>
        <Typography variant="caption">{name}</Typography>
      </Grid2>
      {!showSettings && (
        <Grid2 size="auto">
          <LegendRowDetails
            featureTypeProps={featureTypeData[id].props}
            {...{ id, name, ...props }}
          />
        </Grid2>
      )}
    </Grid2>
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
        <Grid2 container spacing={1} sx={{ alignItems: 'center' }}>
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
      )}
      {legendGroupData.map(({ id, value, ...props }, index) =>
        value || showSettings ? (
          <Fragment key={id}>
            {index > 0 && <Divider sx={{ opacity: 0.6, width: '100%' }} />}
            <MapFeature
              legendGroupId={legendGroup.id}
              {...{ mapId, id, value, showSettings, ...props }}
            />
          </Fragment>
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
  <Stack>
    <LegendGroups showSettings {...{ mapId, ...props }} />
    <Button
      variant="contained"
      color="warning"
      sx={{ mt: 1.5 }}
      onClick={onChangeView}
    >
      Switch to Full View
    </Button>
  </Stack>
)

const MinimalLegend = ({ mapId, onChangeView }) => {
  const {
    showSettings,
    showLegendGroupNames,
    handleToggleLegendGroupNames,
    handleToggleSettings,
  } = useLegend(mapId)
  return (
    <LegendRoot sx={styles.root} elevation={12} {...{ mapId }}>
      <LegendHeader
        label={showSettings ? 'Settings' : 'Legend'}
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

export default memo(MinimalLegend)
