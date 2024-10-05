/** @jsxImportSource @emotion/react */
import {
  Badge,
  Box,
  Divider,
  Grid,
  Grid2,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useState, useEffect, useMemo } from 'react'
import { BlockPicker } from 'react-color'
import { FaFilter } from 'react-icons/fa'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { VscEditorLayout } from 'react-icons/vsc'
import { useSelector, useDispatch } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectEnabledArcsFunc,
  selectEnabledNodesFunc,
  selectEnabledGeosFunc,
  selectGeoRange,
  selectNodeRange,
  selectArcRange,
  selectLegendDataFunc,
  selectLocalizedArcTypes,
  selectLocalizedNodeTypes,
  selectLocalizedGeoTypes,
  selectSync,
  selectNodeRangeAtZoomFunc,
  selectArcTypeKeys,
  selectNodeTypeKeys,
  selectNumberFormatPropsFn,
  selectPageLayout,
  selectMapData,
  selectIsGlobe,
} from '../../../data/selectors'
import { propId, statId, statFns } from '../../../utils/enums'
import { useFilter } from '../../../utils/hooks'
import { getStatLabel } from '../../../utils/stats'
import { DataGridModal } from '../common/BaseModal'
import GridFilter from '../common/GridFilter'

import {
  FetchedIcon,
  GradientBox,
  IconPicker,
  OverflowText,
  SimpleDropdown,
  SizePickerTooltip,
  StableTooltip,
} from '../../compound'

import {
  NumberFormat,
  capitalize,
  withIndex,
  eitherBoolOrNotNull,
  includesPath,
} from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ml: 'auto',
    mr: 'auto',
    p: 1,
  },
  root: {
    position: 'absolute',
    top: '8px',
    zIndex: 1,
    overflow: 'auto',
  },
  paper: {
    width: 600,
    p: (theme) => theme.spacing(0, 2, 2),
    mx: 0,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
  },
  overflowAlignLeft: {
    textAlign: 'left',
    // fontSize: '20px',
  },
  bold: {
    fontWeight: 700,
  },
  categoryIcon: {
    p: 0.5,
    mx: 'auto',
    my: 0.75,
    width: '16px',
    height: '16px',
    borderRadius: 1,
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

const nonSx = {
  itemSummary: {
    cursor: 'pointer',
    display: 'block',
  },
  listTitle: {
    fontSize: '25px',
    fontWeight: 700,
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  primaryDetails: {
    marginTop: '20px',
    '& > summary': {
      display: 'block',
      cursor: 'pointer',
      '& > svg': {
        position: 'relative',
        left: '25%',
        display: 'none',
        '&:first-of-type': { display: 'initial' },
      },
    },
    '&[open] > summary': {
      '& > span:nth-of-type(2)': {
        display: 'none',
      },
      '& > svg': {
        '&:first-of-type': { display: 'none' },
        '&:nth-of-type(2)': { display: 'initial' },
      },
    },
  },
  typeWrapper: {
    border: '1px solid',
    padding: '12px 4px 8px 4px',
    marginTop: '12px',
    borderRadius: '4px',
    // backgroundColor: '#383838',
  },
}

const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}

const getMinMaxLabel = (valRange, numberFormatRaw, group, end, labelEnd) => {
  const numberFormat = R.omit(['unit', 'unitPlacement'])(numberFormatRaw)
  const getNumLabel = () =>
    NumberFormat.format(R.prop(end, valRange), {
      ...numberFormat,
      // Formatting hierarchy: `props.legend<key>` -> `settings.defaults.legend<key>` -> `props.<key>` -> `settings.defaults.<key>`
      ...{
        precision: numberFormat.legendPrecision || numberFormat.precision,
        notation: numberFormat.legendNotation || numberFormat.notation,
        notationDisplay:
          numberFormat.legendNotationDisplay || numberFormat.notationDisplay,
      },
    })
  return group ? getNumLabel() : numberFormat[labelEnd] || getNumLabel()
}

const getMinLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'min', 'legendMinLabel')

const getMaxLabel = (valRange, numberFormat, group) =>
  getMinMaxLabel(valRange, numberFormat, group, 'max', 'legendMaxLabel')

const CategoricalColorItems = ({
  colorRange,
  getLabel = capitalize,
  mapId,
  legendGroupId,
  geometryType,
  propId,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const basePath = [
    'maps',
    'data',
    mapId,
    'legendGroups',
    legendGroupId,
    'data',
    geometryType,
    'colorByOptions',
    propId,
  ]

  return (
    <OverflowText sx={{ width: '100%' }}>
      <Stack direction="row" spacing={3} justifyContent="center">
        {R.values(
          R.mapObjIndexed(
            (val, key) => (
              <Stack alignItems="center" key={key}>
                <StableTooltip
                  title={
                    <BlockPicker
                      color={val}
                      triangle="hide"
                      onChangeComplete={(color) =>
                        dispatch(
                          mutateLocal({
                            path: R.append(key, basePath),
                            sync: !includesPath(
                              R.values(sync),
                              R.append(key, basePath)
                            ),
                            value: `rgba(${color.rgb.r},${color.rgb.g},${
                              color.rgb.b
                            },${color.rgb.a * 255})`,
                          })
                        )
                      }
                    />
                  }
                >
                  <div>
                    <Paper
                      sx={[styles.categoryIcon, { bgcolor: val }]}
                      elevation={3}
                    />
                    <div>{getLabel(key)}</div>
                  </div>
                </StableTooltip>
              </Stack>
            ),
            colorRange
          )
        )}
      </Stack>
    </OverflowText>
  )
}

const CategoricalSizeItems = ({
  sizeRange,
  getLabel = capitalize,
  icon,
  iconPath,
  sizePath,
  geometryType,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  return (
    <OverflowText sx={{ width: '100%' }}>
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems={'flex-end'}
      >
        {R.values(
          R.mapObjIndexed(
            (val, key) => (
              <Stack alignItems="center" key={key}>
                <StableTooltip
                  enabled={geometryType === 'nodes'}
                  title={
                    <IconPicker
                      onSelect={(iconName) => {
                        dispatch(
                          mutateLocal({
                            path: iconPath,
                            sync: !includesPath(R.values(sync), iconPath),
                            value: iconName,
                          })
                        )
                      }}
                    />
                  }
                >
                  <Grid
                    item
                    container
                    alignItems="center"
                    justifyContent={'center'}
                    xs={4}
                  >
                    <Grid item>
                      {addExtraProps(icon, {
                        css: {
                          width: val,
                          height: val,
                        },
                      })}
                    </Grid>
                  </Grid>
                </StableTooltip>
                <div>
                  <SizePickerTooltip
                    value={parseFloat(val)}
                    onSelect={(newSize) => {
                      dispatch(
                        mutateLocal({
                          path: [...sizePath, key],
                          sync: !includesPath(R.values(sync), sizePath),
                          value: newSize,
                        })
                      )
                    }}
                  >
                    <div>{getLabel(key)}</div>
                  </SizePickerTooltip>
                </div>
              </Stack>
            ),
            sizeRange
          )
        )}
      </Stack>
    </OverflowText>
  )
}

const MapLegendGroupRowToggleLayer = ({
  icon,
  toggle,
  legendName,
  toggleGroup,
  toggleGroupLabel,
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
  filterableProps: filterables,
  filterableExtraProps,
  onSaveFilters,
  mapId,
  ...props
}) => {
  const { filterOpen, handleOpenFilter, handleCloseFilter } = useFilter()
  const pageLayout = useSelector(selectPageLayout)
  const mapData = useSelector(selectMapData)

  const numActiveFilters = useMemo(
    () => R.count(R.propEq('rule', 'type'))(filters),
    [filters]
  )

  const isFilterDisabled = useMemo(
    () => R.isEmpty(filterables) || toggleGroupLabel === 'Grouped',
    [filterables, toggleGroupLabel]
  )
  const labelStart = useMemo(() => {
    const isMaximized = R.any(R.propEq(true, 'maximized'))(pageLayout)
    if (isMaximized) return null

    const mapIndices = R.addIndex(R.reduce)(
      (acc, value, index) =>
        R.when(R.always(R.propEq(mapId, 'mapId')(value)), R.append(index))(acc),
      []
    )(pageLayout)
    return mapIndices.length > 1
      ? R.pathOr(mapId, [mapId, 'name'])(mapData)
      : `${
          ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][
            mapIndices[0]
          ]
        } Chart`
  }, [mapData, mapId, pageLayout])

  return (
    <Grid container spacing={0} alignItems="center" {...props}>
      <Grid item xs={1} className="my-auto text-center">
        <Box sx={{ ml: 1 }}>{icon}</Box>
      </Grid>
      <Grid item xs={2} className="my-auto ml-0">
        {toggle}
      </Grid>
      {toggleGroup ? (
        <>
          <Grid item xs={4.5} className="my-auto ml-0">
            <OverflowText sx={styles.overflowAlignLeft} text={legendName} />
          </Grid>
          <Grid item xs={1} className="my-auto">
            {toggleGroup}
          </Grid>
          <Grid item xs={2} className="my-auto ml-0">
            <OverflowText
              sx={styles.overflowAlignLeft}
              text={toggleGroupLabel}
            />
          </Grid>
        </>
      ) : (
        <Grid item xs={7.5} className="my-auto">
          <OverflowText sx={styles.overflowAlignLeft} text={legendName} />
        </Grid>
      )}
      <Grid item xs={1.5} className="my-auto">
        <DataGridModal
          open={filterOpen}
          label="Chart Data Filter"
          labelExtra={`(${labelStart ? `${labelStart} \u279D ` : ''}${legendName})`}
          onClose={handleCloseFilter}
        >
          <GridFilter
            {...{ filterables, filterableExtraProps }}
            defaultFilters={filters}
            onSave={onSaveFilters}
          />
        </DataGridModal>
        <IconButton
          disabled={isFilterDisabled}
          sx={{ p: 0.5 }}
          value="filter"
          onClick={handleOpenFilter}
        >
          <Badge
            color={isFilterDisabled ? 'default' : 'info'}
            badgeContent={numActiveFilters}
          >
            <FaFilter size={20} />
          </Badge>
        </IconButton>
      </Grid>
    </Grid>
  )
}

const GroupCalcDropdown = ({ propType, value, onSelect }) => {
  const optionsList = [...statFns[propType].values()]
  if (!statFns[propType].has(value)) {
    // When a different prop type is selected and the
    // current aggr. fn is not supported, the first
    // element of the list of agg. Fns is chosen
    onSelect(optionsList[0])
  }
  return (
    <Grid
      item
      container
      alignItems="center"
      justifyContent="center"
      paddingLeft="4px"
      // spacing={1}
      xs={12}
    >
      <Grid item>
        <FetchedIcon
          iconName={
            propType === propId.TOGGLE
              ? 'tb/TbLogicAnd'
              : propType === propId.NUMBER
                ? 'tb/TbMathFunction'
                : 'tb/TbMathFunction' // TODO: Different icon for a `selector`?
          }
          size={24}
        />
      </Grid>
      <Grid item xs>
        <SimpleDropdown
          marquee
          paperProps={{ elevation: 3 }}
          getLabel={getStatLabel}
          {...{ optionsList, value, onSelect }}
        />
      </Grid>
    </Grid>
  )
}

const MapLegendSizeBySection = ({
  sizeProp,
  sizeRange,
  valueRange,
  getPropName,
  typeObj,
  syncPath,
  icon,
  group,
  propValue,
  onSelectProp,
  geometryName,
  geometryType,
  legendGroupId,
  legendObj,
  mapId,
  getCategoryName,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const prop = typeObj.props[sizeProp]
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)

  const syncSize = !includesPath(R.values(sync), syncPath)

  const typePath = [
    'maps',
    'data',
    mapId,
    'legendGroups',
    legendGroupId,
    'data',
    geometryType,
  ]
  const iconPath = R.append('icon')(typePath)
  const startSizePath = [...typePath, 'sizeByOptions', sizeProp, 'startSize']
  const endSizePath = [...typePath, 'sizeByOptions', sizeProp, 'endSize']
  const propSizePath = [...typePath, 'sizeByOptions', sizeProp]

  const isCategorical = !R.has('min', sizeRange)

  return (
    <>
      {/* First row: Prop selector + unit label */}
      <Grid
        item
        container
        alignItems="center"
        justifyContent="center"
        xs={12}
        spacing={numberFormatProps.unit ? 0.5 : 0}
      >
        <Grid item zeroMinWidth xs>
          <SimpleDropdown
            paperProps={{ elevation: 3 }}
            marquee
            value={sizeProp}
            getLabel={getPropName}
            optionsList={R.keys(R.prop('sizeByOptions')(legendObj))}
            onSelect={(value) => {
              dispatch(mutateLocal({ path: syncPath, sync: syncSize, value }))
            }}
          />
        </Grid>
        {numberFormatProps.unit && (
          <Grid item xs={4}>
            <Typography
              component={Paper}
              elevation={1}
              variant="subtitle1"
              sx={styles.unit}
            >
              <OverflowText text={numberFormatProps.unit} />
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Second row: Size icons with value range */}
      {isCategorical ? (
        <CategoricalSizeItems
          sizeRange={sizeRange}
          getLabel={getCategoryName}
          icon={icon}
          iconPath={iconPath}
          sizePath={propSizePath}
          geometryType={geometryName}
        />
      ) : (
        <Grid
          item
          container
          alignItems="center"
          justifyContent="center"
          xs={12}
        >
          <SizePickerTooltip
            value={parseFloat(R.prop('startSize')(sizeRange))}
            onSelect={(newSize) => {
              dispatch(
                mutateLocal({
                  path: startSizePath,
                  sync: !includesPath(R.values(sync), startSizePath),
                  value: newSize,
                })
              )
            }}
          >
            <Grid
              item
              sx={{ pr: 1, fontWeight: 700, textAlign: 'right' }}
              xs={3.5}
            >
              <OverflowText
                text={getMinLabel(valueRange, numberFormatProps, group)}
              />
            </Grid>
          </SizePickerTooltip>
          <StableTooltip
            enabled={geometryName === 'nodes'}
            title={
              <IconPicker
                onSelect={(iconName) => {
                  dispatch(
                    mutateLocal({
                      path: iconPath,
                      sync: !includesPath(R.values(sync), iconPath),
                      value: iconName,
                    })
                  )
                }}
              />
            }
          >
            <Grid
              item
              container
              alignItems="center"
              justifyContent={'center'}
              xs={4}
            >
              <Grid item sx={{ pr: 0.75 }}>
                {addExtraProps(icon, {
                  css: {
                    width: R.prop('startSize')(sizeRange),
                    height: R.prop('startSize')(sizeRange),
                  },
                })}
              </Grid>
              <Grid item sx={{ pl: 0.75 }}>
                {addExtraProps(icon, {
                  css: {
                    width: R.prop('endSize')(sizeRange),
                    height: R.prop('endSize')(sizeRange),
                  },
                })}
              </Grid>
            </Grid>
          </StableTooltip>
          <SizePickerTooltip
            value={parseFloat(R.prop('endSize')(sizeRange))}
            onSelect={(newSize) => {
              dispatch(
                mutateLocal({
                  path: endSizePath,
                  sync: !includesPath(R.values(sync), endSizePath),
                  value: newSize,
                })
              )
            }}
          >
            <Grid
              item
              sx={{ pl: 1, fontWeight: 700, textAlign: 'left' }}
              xs={3.5}
            >
              <OverflowText
                text={getMaxLabel(valueRange, numberFormatProps, group)}
              />
            </Grid>
          </SizePickerTooltip>
        </Grid>
      )}
      {/* Third row: Clustering functions */}
      {group && (
        <GroupCalcDropdown
          propType={typeObj.props[sizeProp].type}
          value={propValue}
          onSelect={onSelectProp}
        />
      )}
    </>
  )
}

const MapLegendColorBySection = ({
  colorProp,
  colorRange,
  valueRange,
  getPropName,
  typeObj,
  syncPath,
  getCategoryName,
  group,
  propValue,
  onSelectProp,
  geometryType,
  legendObj,
  mapId,
  legendGroupId,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const syncColor = !includesPath(R.values(sync), syncPath)
  const isCategorical = !R.has('min', colorRange)

  const prop = typeObj.props[colorProp]
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)

  return (
    <>
      {/* First row: Prop selector + unit label */}
      <Grid
        item
        container
        alignItems="center"
        justifyContent="center"
        xs={12}
        spacing={numberFormatProps.unit ? 0.5 : 0}
      >
        <Grid item zeroMinWidth xs>
          <SimpleDropdown
            paperProps={{ elevation: 3 }}
            marquee
            value={colorProp}
            optionsList={R.keys(R.prop('colorByOptions')(legendObj))}
            getLabel={getPropName}
            onSelect={(value) => {
              dispatch(mutateLocal({ path: syncPath, value, sync: syncColor }))
            }}
          />
        </Grid>
        {numberFormatProps.unit && (
          <Grid item xs={4}>
            <Typography
              component={Paper}
              elevation={1}
              variant="subtitle1"
              sx={styles.unit}
            >
              <OverflowText text={numberFormatProps.unit} />
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Second row: Color gradient for value range */}
      <Grid item container alignItems="center" justifyContent="center" xs={12}>
        {isCategorical ? (
          <CategoricalColorItems
            getLabel={getCategoryName}
            propId={colorProp}
            {...{ colorRange, geometryType, legendGroupId, mapId }}
          />
        ) : (
          <GradientBox
            minColor={R.prop('startGradientColor', colorRange)}
            maxColor={R.prop('endGradientColor')(colorRange)}
            maxLabel={getMaxLabel(valueRange, numberFormatProps, group)}
            minLabel={getMinLabel(valueRange, numberFormatProps, group)}
            colorPropPath={[
              'maps',
              'data',
              mapId,
              'legendGroups',
              legendGroupId,
              'data',
              geometryType,
              'colorByOptions',
              colorProp,
            ]}
          />
        )}
      </Grid>

      {/* Third row: Clustering functions */}
      {group && (
        <GroupCalcDropdown
          propType={typeObj.props[colorProp].type}
          value={propValue}
          onSelect={onSelectProp}
        />
      )}
    </>
  )
}

const MapLegendHeightBySection = ({
  heightProp,
  heightRange,
  valueRange,
  getPropName,
  typeObj,
  syncPath,
  icon,
  group,
  propValue,
  onSelectProp,
  geometryName,
  geometryType,
  legendGroupId,
  legendObj,
  mapId,
  getCategoryName,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const isGlobe = useSelector(selectIsGlobe)(mapId)

  const prop = typeObj.props[heightProp]
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)

  const syncSize = !includesPath(R.values(sync), syncPath)

  const typePath = [
    'maps',
    'data',
    mapId,
    'legendGroups',
    legendGroupId,
    'data',
    geometryType,
  ]
  const iconPath = R.append('icon')(typePath)
  const propHeightPath = R.concat(typePath, ['heightByOptions', heightProp])
  const startHeightPath = R.append('startHeight', propHeightPath)
  const endHeightPath = R.append('endHeight', propHeightPath)

  const isCategorical = !R.has('min', heightRange)

  if (isGlobe)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gridRow: `1 / span ${group ? 3 : 2}`,
          padding: 1,
          fontWeight: 'bold',
        }}
      >
        Zoom in or switch to Mercator map to set heightBy.
      </Box>
    )

  return (
    <>
      {/* First row: Prop selector + unit label */}
      <Grid
        item
        container
        alignItems="center"
        justifyContent="center"
        xs={12}
        spacing={numberFormatProps.unit ? 0.5 : 0}
      >
        <Grid item zeroMinWidth xs>
          <SimpleDropdown
            paperProps={{ elevation: 3 }}
            marquee
            value={heightProp}
            getLabel={getPropName}
            optionsList={R.keys(R.prop('heightByOptions')(legendObj))}
            onSelect={(value) =>
              dispatch(mutateLocal({ path: syncPath, sync: syncSize, value }))
            }
          />
        </Grid>
        {numberFormatProps.unit && (
          <Grid item xs={4}>
            <Typography
              component={Paper}
              elevation={1}
              variant="subtitle1"
              sx={styles.unit}
            >
              <OverflowText text={numberFormatProps.unit} />
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Second row: Size icons with value range */}
      {isCategorical ? (
        <CategoricalSizeItems
          sizeRange={heightRange}
          getLabel={getCategoryName}
          icon={icon}
          iconPath={iconPath}
          sizePath={propHeightPath}
          geometryType={geometryName}
        />
      ) : (
        <Grid
          item
          container
          alignItems="center"
          justifyContent="center"
          xs={12}
        >
          <SizePickerTooltip
            value={parseFloat(R.prop('startHeight', heightRange))}
            onSelect={(newSize) =>
              dispatch(
                mutateLocal({
                  path: startHeightPath,
                  sync: !includesPath(R.values(sync), startHeightPath),
                  value: newSize,
                })
              )
            }
          >
            <Grid
              item
              sx={{ pr: 1, fontWeight: 700, textAlign: 'right' }}
              xs={3.5}
            >
              <OverflowText
                text={getMinLabel(valueRange, numberFormatProps, group)}
              />
            </Grid>
          </SizePickerTooltip>
          <StableTooltip
            enabled={geometryName === 'nodes'}
            title={
              <IconPicker
                onSelect={(iconName) =>
                  dispatch(
                    mutateLocal({
                      path: iconPath,
                      sync: !includesPath(R.values(sync), iconPath),
                      value: iconName,
                    })
                  )
                }
              />
            }
          >
            <Grid
              item
              container
              alignItems="flex-end"
              justifyContent="center"
              height="50px"
              gap={2}
              xs={4}
            >
              <Box
                width="4px"
                height={`${parseFloat(R.slice(0, -2, R.prop('startHeight', heightRange))) * 0.5}px`}
                backgroundColor="white"
                xs={6}
              />
              <Box
                width="4px"
                height={`${parseFloat(R.slice(0, -2, R.prop('endHeight', heightRange))) * 0.5}px`}
                backgroundColor="white"
                xs={6}
              />
            </Grid>
          </StableTooltip>
          <SizePickerTooltip
            value={parseFloat(R.prop('endHeight', heightRange))}
            onSelect={(newSize) =>
              dispatch(
                mutateLocal({
                  path: endHeightPath,
                  sync: !includesPath(R.values(sync), endHeightPath),
                  value: newSize,
                })
              )
            }
          >
            <Grid
              item
              sx={{ pl: 1, fontWeight: 700, textAlign: 'left' }}
              xs={3.5}
            >
              <OverflowText
                text={getMaxLabel(valueRange, numberFormatProps, group)}
              />
            </Grid>
          </SizePickerTooltip>
        </Grid>
      )}

      {/* Third row: Clustering functions */}
      {group && (
        <GroupCalcDropdown
          propType={typeObj.props[heightProp].type}
          value={propValue}
          onSelect={onSelectProp}
        />
      )}
    </>
  )
}

const MapLegendGeoToggle = ({
  geoType,
  legendGroupId,
  colorProp,
  heightProp,
  mapId,
  legendObj,
}) => {
  const geometryRange = useSelector(selectGeoRange)
  const typeObj = R.prop(geoType, useSelector(selectLocalizedGeoTypes))

  return (
    <LegendCard
      geometryType={geoType}
      typeObj={typeObj}
      legendGroupId={legendGroupId}
      sizeProp={null}
      colorProp={colorProp}
      heightProp={heightProp}
      selectEnabledGeometryFunc={selectEnabledGeosFunc}
      geometryRange={geometryRange}
      clusterRange={{}}
      geometryName="geos"
      icon={R.prop('icon', legendObj)}
      mapId={mapId}
      legendObj={legendObj}
    />
  )
}

const MapLegendNodeToggle = ({
  nodeType,
  legendGroupId,
  sizeProp,
  colorProp,
  mapId,
  legendObj,
}) => {
  const [clusterRange, setClusterRange] = useState({})
  const geometryRange = useSelector(selectNodeRange)
  const geometryRangesByType = useSelector(selectNodeRangeAtZoomFunc)(mapId)
  const typeObj = R.prop(nodeType, useSelector(selectLocalizedNodeTypes))

  useEffect(() => {
    if (!R.equals(clusterRange, geometryRangesByType))
      setClusterRange(geometryRangesByType)
  }, [clusterRange, geometryRangesByType])

  return (
    <LegendCard
      geometryType={nodeType}
      typeObj={typeObj}
      legendGroupId={legendGroupId}
      sizeProp={sizeProp}
      colorProp={colorProp}
      selectEnabledGeometryFunc={selectEnabledNodesFunc}
      geometryRange={geometryRange}
      clusterRange={clusterRange}
      geometryName="nodes"
      icon={R.prop('icon', legendObj)}
      mapId={mapId}
      legendObj={legendObj}
    />
  )
}

const MapLegendArcToggle = ({
  arcType,
  legendGroupId,
  sizeProp,
  colorProp,
  heightProp,
  mapId,
  legendObj,
}) => {
  const geometryRange = useSelector(selectArcRange)
  const typeObj = R.prop(arcType, useSelector(selectLocalizedArcTypes))
  const iconClass =
    legendObj.lineBy === 'dotted'
      ? 'ai/AiOutlineEllipsis'
      : legendObj.lineBy === 'dashed'
        ? 'ai/AiOutlineDash'
        : legendObj.lineBy === '3d'
          ? 'vsc/VscLoading'
          : 'ai/AiOutlineLine'

  return (
    <LegendCard
      geometryType={arcType}
      typeObj={typeObj}
      legendGroupId={legendGroupId}
      sizeProp={sizeProp}
      colorProp={colorProp}
      heightProp={heightProp}
      selectEnabledGeometryFunc={selectEnabledArcsFunc}
      geometryRange={geometryRange}
      clusterRange={{}}
      geometryName="arcs"
      icon={iconClass}
      mapId={mapId}
      legendObj={legendObj}
    />
  )
}

const LegendCard = memo(
  ({
    geometryType,
    typeObj,
    legendGroupId,
    sizeProp,
    colorProp,
    heightProp,
    selectEnabledGeometryFunc,
    geometryRange,
    clusterRange,
    geometryName,
    legendObj,
    icon,
    mapId,
  }) => {
    const dispatch = useDispatch()
    const displayedGeometry = useSelector(selectEnabledGeometryFunc)(mapId)
    const sync = useSelector(selectSync)

    const getGeometryPropName = useCallback(
      (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
      [typeObj]
    )
    const getGeometryCategoryName = useCallback(
      (key) =>
        R.pathOr(
          capitalize(key),
          ['props', colorProp, 'options', key, 'name'],
          typeObj
        ),
      [typeObj, colorProp]
    )
    // Prevent legend from rendering before data is processed
    if (R.isEmpty(displayedGeometry)) return []

    const basePath = [
      'maps',
      'data',
      mapId,
      'legendGroups',
      legendGroupId,
      'data',
      geometryType,
    ]
    const path = R.append('value', basePath)
    const syncToggle = !includesPath(R.values(sync), path)

    const groupPath = R.append('group', basePath)
    const syncGroupToggle = !includesPath(R.values(sync), groupPath)

    const allowGrouping = displayedGeometry[geometryType].allowGrouping || false
    const group = displayedGeometry[geometryType].group || false

    const groupCalcBySize =
      displayedGeometry[geometryType].groupCalcBySize || statId.COUNT
    const groupCalcSizePath = R.append('groupCalcBySize', basePath)
    const syncGroupCalcSize = !includesPath(R.values(sync), groupCalcSizePath)

    const groupCalcByColor =
      displayedGeometry[geometryType].groupCalcByColor || statId.COUNT
    const groupCalcColorPath = R.append('groupCalcByColor', basePath)
    const syncGroupCalcColor = !includesPath(R.values(sync), groupCalcColorPath)

    const groupCalcByHeight =
      displayedGeometry[geometryType].groupCalcByHeight || statId.COUNT
    const groupCalcHeightPath = R.append('groupCalcByHeight', basePath)
    const syncGroupCalcHeight = !includesPath(
      R.values(sync),
      groupCalcHeightPath
    )

    const filterableProps = R.pipe(
      R.prop('props'),
      R.reject(
        R.whereAny({
          type: R.equals('head'), // Leave out layout props
          filterable: R.equals('false'),
        })
      )
    )(typeObj)

    const filterableExtraProps = R.mapObjIndexed((value, key) =>
      // eslint-disable-next-line ramda/cond-simplification
      R.cond([
        [
          R.propEq('selector', 'type'),
          R.always({
            colorByOptions: R.path(['colorByOptions', key])(legendObj),
          }),
        ],
        // Others if needed
      ])(value)
    )(filterableProps)

    const { color: colorDomain, size: sizeDomain } = R.propOr(
      {},
      geometryType,
      clusterRange
    )

    const sizeRange = geometryRange(
      geometryType,
      sizeProp,
      mapId,
      'sizeByOptions'
    )
    const colorRange = geometryRange(
      geometryType,
      colorProp,
      mapId,
      'colorByOptions'
    )
    const heightRange = geometryRange(
      geometryType,
      heightProp,
      mapId,
      'heightByOptions'
    )

    const numSections = [sizeRange, colorRange, heightRange].filter(
      (property) => property !== undefined
    ).length
    const numDividers = numSections - 1
    const percentagePerSection = (100 - 3 * numDividers) / numSections
    const gridTemplateColumns = `${new Array(numSections).fill(`${percentagePerSection}%`).join(' 1% ')}`

    const syncFilters = !includesPath(R.values(sync), [...basePath, 'filters'])
    const handleSaveFilters = (newFilters) => {
      dispatch(
        mutateLocal({
          path: [
            'maps',
            'data',
            mapId,
            'legendGroups',
            legendGroupId,
            'data',
            geometryType,
            'filters',
          ],
          value: newFilters,
          sync: syncFilters,
        })
      )
    }

    const isOpen = eitherBoolOrNotNull(displayedGeometry[geometryType])

    return (
      <details key={geometryType} css={nonSx.typeWrapper} open={isOpen}>
        <summary css={nonSx.itemSummary}>
          <MapLegendGroupRowToggleLayer
            icon={<FetchedIcon iconName={icon} />}
            legendName={R.propOr(geometryType, 'name')(typeObj)}
            toggle={
              <Switch
                name={`cave-toggle-map-${geometryName}`}
                checked={isOpen}
                onChange={(event) => {
                  event.target.checked
                    ? dispatch(
                        mutateLocal({ path, sync: syncToggle, value: true })
                      )
                    : dispatch(
                        mutateLocal({ path, sync: syncToggle, value: false })
                      )
                }}
              />
            }
            {...{ filterableProps, filterableExtraProps, mapId }}
            filters={legendObj.filters}
            onSaveFilters={handleSaveFilters}
            {...(allowGrouping && {
              toggleGroupLabel: group ? 'Grouped' : 'Ungrouped',
              toggleGroup: (
                <ToggleButton
                  sx={{ p: 0.5 }}
                  color="primary"
                  value="group"
                  selected={group}
                  onChange={() => {
                    dispatch(
                      mutateLocal({
                        sync: syncGroupToggle,
                        path: groupPath,
                        value: !group,
                      })
                    )
                  }}
                >
                  <FetchedIcon
                    iconName={
                      group ? 'fa6/FaRegObjectGroup' : 'fa6/FaRegObjectUngroup'
                    }
                    size={26}
                    color="text.primary"
                  />
                </ToggleButton>
              ),
            })}
          />
        </summary>
        <hr />
        <Box
          display="grid"
          gridTemplateColumns={gridTemplateColumns}
          gridTemplateRows={`repeat(${group ? 3 : 2}, auto)`}
          gridAutoFlow="column"
          pr={2}
          columnGap={1}
        >
          {R.has('sizeByOptions', legendObj) && (
            <>
              <MapLegendSizeBySection
                {...{
                  sizeProp,
                  sizeRange,
                  typeObj,
                  group,
                  geometryName,
                  geometryType,
                  legendObj,
                  mapId,
                  legendGroupId,
                }}
                valueRange={group && sizeDomain ? sizeDomain : sizeRange}
                icon={<FetchedIcon iconName={icon} />}
                getPropName={getGeometryPropName}
                getCategoryName={getGeometryCategoryName}
                syncPath={R.append('sizeBy', basePath)}
                propValue={groupCalcBySize}
                onSelectProp={(value) => {
                  dispatch(
                    mutateLocal({
                      path: groupCalcSizePath,
                      sync: syncGroupCalcSize,
                      value,
                    })
                  )
                }}
              />

              {numSections > 1 && (
                <Divider
                  orientation="vertical"
                  sx={{
                    gridRow: 'span 3',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderStyle: 'dotted',
                  }}
                />
              )}
            </>
          )}

          {R.has('colorByOptions', legendObj) && (
            <>
              <MapLegendColorBySection
                {...{
                  colorProp,
                  colorRange,
                  typeObj,
                  group,
                  geometryType,
                  legendObj,
                  mapId,
                  legendGroupId,
                }}
                valueRange={group && colorDomain ? colorDomain : colorRange}
                getPropName={getGeometryPropName}
                getCategoryName={getGeometryCategoryName}
                syncPath={R.append('colorBy', basePath)}
                propValue={groupCalcByColor}
                onSelectProp={(value) => {
                  dispatch(
                    mutateLocal({
                      path: groupCalcColorPath,
                      sync: syncGroupCalcColor,
                      value,
                    })
                  )
                }}
              />

              {R.has('heightByOptions', legendObj) && (
                <Divider
                  orientation="vertical"
                  sx={{
                    gridRow: 'span 3',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderStyle: 'dotted',
                  }}
                />
              )}
            </>
          )}

          {R.has('heightByOptions', legendObj) && (
            <MapLegendHeightBySection
              {...{
                heightProp,
                heightRange,
                typeObj,
                group,
                geometryName,
                geometryType,
                legendObj,
                mapId,
                legendGroupId,
              }}
              valueRange={heightRange}
              icon={<FetchedIcon iconName={icon} />}
              getPropName={getGeometryPropName}
              getCategoryName={getGeometryCategoryName}
              syncPath={R.append('heightBy', basePath)}
              propValue={groupCalcByHeight}
              onSelectProp={(value) => {
                dispatch(
                  mutateLocal({
                    path: groupCalcHeightPath,
                    sync: syncGroupCalcHeight,
                    value,
                  })
                )
              }}
            />
          )}
        </Box>
      </details>
    )
  }
)

const MapLegendToggleList = ({ legendObj, mapId, ...props }) => {
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)

  const getSortedGroups = (layerKey) =>
    withIndex(R.propOr({}, layerKey)(legendObj))

  return (
    <details {...props} open css={nonSx.primaryDetails}>
      <summary css={nonSx.listTitle}>
        <span>{R.propOr(legendObj.id, 'name')(legendObj)}</span>
        <MdExpandMore />
        <MdExpandLess />
        <span>
          <hr />
          {'...'}
          <br />
          <hr />
        </span>
      </summary>
      {R.map((legendItem) => {
        const { id, value, sizeBy, colorBy, heightBy } = legendItem
        return R.includes(id, nodeTypes) ? (
          <MapLegendNodeToggle
            key={id}
            legendGroupId={legendObj.id}
            nodeType={id}
            value={value}
            sizeProp={sizeBy}
            colorProp={colorBy}
            mapId={mapId}
            legendObj={legendItem}
          />
        ) : R.includes(id, arcTypes) ? (
          <MapLegendArcToggle
            key={id}
            legendGroupId={legendObj.id}
            arcType={id}
            value={value}
            sizeProp={sizeBy}
            colorProp={colorBy}
            heightProp={heightBy}
            mapId={mapId}
            legendObj={legendItem}
          />
        ) : (
          <MapLegendGeoToggle
            key={id}
            legendGroupId={legendObj.id}
            geoType={id}
            value={value}
            colorProp={colorBy}
            heightProp={heightBy}
            mapId={mapId}
            legendObj={legendItem}
          />
        )
      })(getSortedGroups('data'))}
    </details>
  )
}

const ClassicLegend = ({ mapId, onChangeView }) => {
  const legendData = useSelector(selectLegendDataFunc)(mapId)
  return (
    <Box sx={styles.paper}>
      <Grid2 container spacing={1} sx={{ alignItems: 'center', px: 0.8 }}>
        <Grid2 size="grow" sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Map Legend
          </Typography>
        </Grid2>
        <Grid2 size="auto">
          <IconButton
            size="large"
            color="primary"
            sx={{ position: 'absolute', top: '8px', right: '8px' }}
            onClick={onChangeView}
          >
            <VscEditorLayout />
          </IconButton>
        </Grid2>
      </Grid2>
      {R.map((legendObj) => (
        <MapLegendToggleList key={legendObj.id} {...{ mapId, legendObj }} />
      ))(withIndex(legendData))}
    </Box>
  )
}

export default memo(ClassicLegend)
