/** @jsxImportSource @emotion/react */
import {
  Box,
  Divider,
  Grid,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback } from 'react'
import { BlockPicker } from 'react-color'
import { AiOutlineDash, AiOutlineEllipsis, AiOutlineLine } from 'react-icons/ai'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { VscLoading } from 'react-icons/vsc'
import { useSelector, useDispatch } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectBearingSliderToggle,
  selectEnabledArcs,
  selectEnabledNodes,
  selectEnabledGeos,
  selectMapLegend,
  selectTheme,
  selectGeoColorRange,
  selectNodeRange,
  selectArcRange,
  selectLegendData,
  selectLocalizedArcTypes,
  selectLocalizedNodeTypes,
  selectLocalizedGeoTypes,
  selectSync,
  selectPitchSliderToggle,
  selectAppBarId,
  selectNodeRangeAtZoom,
  selectArcTypeKeys,
  selectNodeTypeKeys,
  selectRightAppBarDisplay,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { propId, statId, statFns } from '../../../utils/enums'
import { getStatLabel } from '../../../utils/stats'

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
  capitalize,
  customSort,
  eitherBoolOrNotNull,
  formatNumber,
  includesPath,
  serializeNumLabel,
} from '../../../utils'

const styles = {
  paper: {
    width: 700,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    p: (theme) => theme.spacing(0, 2, 2),
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      height: 10,
      width: '12px',
      WebkitAppearance: 'none',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      border: '2px solid',
      borderColor: (theme) => (theme.palette.mode === 'dark' ? '' : '#E7EBF0'),
      backgroundColor: 'rgba(0 0 0 / 0.5)',
    },
  },
  root: {
    position: 'absolute',
    top: '10px',
    overflowY: 'hidden',
    zIndex: 1,
  },
  overflowAlignLeft: {
    textAlign: 'left',
    // fontSize: '20px',
  },
  bold: {
    fontWeight: 700,
  },
  categoryIcon: {
    m: 0.75,
    p: 0.5,
    width: '16px',
    height: '16px',
    borderRadius: 1,
  },
  unit: {
    display: 'flex',
    justifyContent: 'center',
    p: '5px 15px', // Matches the built-in padding for the left-side `Dropdown`'s `Button`
    border: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
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

const getMinMaxLabel = (valRange, valProp, typeObj, group, end, labelEnd) => {
  const getNumLabel = () =>
    R.path(['props', valProp, 'legendOverride', 'useScientificFormat'])(
      typeObj
    ) ?? true
      ? serializeNumLabel(
          R.prop(end, valRange),
          R.path(['props', valProp, 'legendOverride', 'scientificPrecision'])(
            typeObj
          )
        )
      : formatNumber(
          R.prop(end, valRange),
          R.pipe(
            R.path(['props', valProp, 'numberFormat']),
            R.dissoc('unit')
          )(typeObj)
        )
  return group
    ? getNumLabel(typeObj)
    : R.pathOr(getNumLabel(typeObj), [
        'props',
        valProp,
        'legendOverride',
        labelEnd,
      ])(typeObj)
}

const getMinLabel = (valRange, valProp, typeObj, group) => {
  return getMinMaxLabel(valRange, valProp, typeObj, group, 'min', 'minLabel')
}

const getMaxLabel = (valRange, valProp, typeObj, group) => {
  return getMinMaxLabel(valRange, valProp, typeObj, group, 'max', 'maxLabel')
}

const CategoricalItems = ({
  colorRange,
  getLabel = capitalize,
  geometryName,
  geometryType,
  propId,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const basePath = [
    geometryName,
    'types',
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
              <Stack alignItems="center" {...{ key }}>
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
                            value: `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`,
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

const MapLegendGroupRowToggleLayer = ({
  icon,
  toggle,
  legendName,
  toggleGroup,
  toggleGroupLabel,
  ...props
}) => {
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
          <Grid item xs={5} className="my-auto ml-0">
            <OverflowText sx={styles.overflowAlignLeft} text={legendName} />
          </Grid>
          <Grid item xs={1.5} className="my-auto">
            {toggleGroup}
          </Grid>
          <Grid item xs={2.5} className="my-auto ml-0">
            <OverflowText
              sx={styles.overflowAlignLeft}
              text={toggleGroupLabel}
            />
          </Grid>
        </>
      ) : (
        <Grid item xs={9} className="my-auto">
          <OverflowText sx={styles.overflowAlignLeft} text={legendName} />
        </Grid>
      )}
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
  getPropName,
  typeObj,
  syncPath,
  icon,
  group,
  propValue,
  onSelectProp,
  geometryName,
  geometryType,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const syncSize = !includesPath(R.values(sync), syncPath)

  const typePath = [geometryName, 'types', geometryType]
  const iconPath = R.append('icon')(typePath)
  const startSizePath = R.append('startSize')(typePath)
  const endSizePath = R.append('endSize')(typePath)

  const unit = R.path(['props', sizeProp, 'numberFormat', 'unit'])(typeObj)
  return (
    <>
      {/* First row: Prop selector + unit label */}
      <Grid
        item
        container
        alignItems="center"
        justifyContent="center"
        xs={12}
        spacing={unit ? 0.5 : 0}
      >
        <Grid item zeroMinWidth xs>
          <SimpleDropdown
            paperProps={{ elevation: 3 }}
            marquee
            value={sizeProp}
            getLabel={getPropName}
            optionsList={R.keys(R.prop('sizeByOptions')(typeObj))}
            onSelect={(value) => {
              dispatch(mutateLocal({ path: syncPath, sync: syncSize, value }))
            }}
          />
        </Grid>
        {unit && (
          <Grid item xs={4}>
            <Paper
              component={Typography}
              elevation={1}
              variant="subtitle1"
              sx={styles.unit}
            >
              <OverflowText text={unit} />
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Second row: Size icons with value range */}
      <Grid item container alignItems="center" justifyContent="center" xs={12}>
        <SizePickerTooltip
          value={R.prop('startSize')(typeObj)}
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
              text={getMinLabel(sizeRange, sizeProp, typeObj, group)}
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
                  width: R.prop('startSize')(typeObj),
                  height: R.prop('startSize')(typeObj),
                },
              })}
            </Grid>
            <Grid item sx={{ pl: 0.75 }}>
              {addExtraProps(icon, {
                css: {
                  width: R.prop('endSize')(typeObj),
                  height: R.prop('endSize')(typeObj),
                },
              })}
            </Grid>
          </Grid>
        </StableTooltip>
        <SizePickerTooltip
          value={R.prop('endSize')(typeObj)}
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
              text={getMaxLabel(sizeRange, sizeProp, typeObj, group)}
            />
          </Grid>
        </SizePickerTooltip>
      </Grid>

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
  geometryName,
  geometryType,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const themeType = useSelector(selectTheme)

  const syncColor = !includesPath(R.values(sync), syncPath)
  const isCategorical = !R.has('min', colorRange)

  const unit = R.path(['props', colorProp, 'numberFormat', 'unit'])(typeObj)
  return (
    <>
      {/* First row: Prop selector + unit label */}
      <Grid
        item
        container
        alignItems="center"
        justifyContent="center"
        xs={12}
        spacing={unit ? 0.5 : 0}
      >
        <Grid item zeroMinWidth xs>
          <SimpleDropdown
            paperProps={{ elevation: 3 }}
            marquee
            value={colorProp}
            optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
            getLabel={getPropName}
            onSelect={(value) => {
              dispatch(mutateLocal({ path: syncPath, value, sync: syncColor }))
            }}
          />
        </Grid>
        {unit && (
          <Grid item xs={4}>
            <Paper
              component={Typography}
              elevation={1}
              variant="subtitle1"
              sx={styles.unit}
            >
              <OverflowText text={unit} />
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Second row: Color gradient for value range */}
      <Grid item container alignItems="center" justifyContent="center" xs={12}>
        {isCategorical ? (
          <CategoricalItems
            getLabel={getCategoryName}
            propId={colorProp}
            {...{ colorRange, geometryName, geometryType }}
          />
        ) : (
          <GradientBox
            minColor={R.pathOr(
              R.prop('startGradientColor', colorRange),
              ['startGradientColor', themeType],
              colorRange
            )}
            maxColor={R.pathOr(
              R.prop('endGradientColor')(colorRange),
              ['endGradientColor', themeType],
              colorRange
            )}
            maxLabel={getMaxLabel(
              valueRange,
              R.prop,
              colorProp,
              typeObj,
              group
            )}
            minLabel={getMinLabel(
              valueRange,
              R.prop,
              colorProp,
              typeObj,
              group
            )}
            colorPropPath={[
              geometryName,
              'types',
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

const MapLegendGeoToggle = ({ geoType, legendGroupId, colorProp }) => {
  const dispatch = useDispatch()
  const themeType = useSelector(selectTheme)
  const geoColorRange = useSelector(selectGeoColorRange)
  const displayedGeos = useSelector(selectEnabledGeos)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)
  const typeObj = R.prop(geoType, useSelector(selectLocalizedGeoTypes))

  const colorRange = geoColorRange(geoType, colorProp)
  const isCategorical = !R.has('min', colorRange)

  const path = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'geos',
    geoType,
    'value',
  ]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'geos',
    geoType,
    'colorBy',
  ]
  const syncColor = !includesPath(R.values(sync), colorPath)

  const getGeoPropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )
  const getGeoCategoryName = useCallback(
    (key) =>
      R.pathOr(
        capitalize(key),
        ['props', colorProp, 'options', key, 'name'],
        typeObj
      ),
    [typeObj, colorProp]
  )

  return (
    <details key={geoType} css={nonSx.typeWrapper} open>
      <summary css={nonSx.itemSummary}>
        <MapLegendGroupRowToggleLayer
          icon={<FetchedIcon iconName={R.prop('icon', typeObj)} />}
          legendName={R.propOr(geoType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={eitherBoolOrNotNull(displayedGeos[geoType])}
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
        />
      </summary>
      <hr />

      <Grid
        container
        alignItems="center"
        justifyContent="center"
        spacing={1}
        padding="8px"
      >
        <Grid item xs={12}>
          <SimpleDropdown
            marquee
            paperProps={{ elevation: 3 }}
            optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
            getLabel={getGeoPropName}
            value={colorProp}
            onSelect={(value) => {
              dispatch(mutateLocal({ sync: syncColor, path: colorPath, value }))
            }}
          />
        </Grid>

        <Grid item container xs={12}>
          {isCategorical ? (
            <CategoricalItems
              getLabel={getGeoCategoryName}
              geometryName="geos"
              geometryType={geoType}
              propId={colorProp}
              {...{ colorRange }}
            />
          ) : (
            <GradientBox
              minColor={R.pathOr(
                colorRange.startGradientColor,
                ['startGradientColor', themeType],
                colorRange
              )}
              maxColor={R.pathOr(
                colorRange.endGradientColor,
                ['endGradientColor', themeType],
                colorRange
              )}
              minLabel={getMinLabel(colorRange, colorProp, typeObj)}
              maxLabel={getMaxLabel(colorRange, colorProp, typeObj)}
              colorPropPath={[
                'geos',
                'types',
                geoType,
                'colorByOptions',
                colorProp,
              ]}
            />
          )}
        </Grid>
      </Grid>
    </details>
  )
}

const MapLegendNodeToggle = ({
  nodeType,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
  const typeObj = R.prop(nodeType, useSelector(selectLocalizedNodeTypes))
  return (
    <LegendCard
      geometryType={nodeType}
      typeObj={typeObj}
      legendGroupId={legendGroupId}
      sizeProp={sizeProp}
      colorProp={colorProp}
      selectEnabledGeometry={selectEnabledNodes}
      selectGeometryRange={selectNodeRange}
      geometryName="nodes"
      icon={<FetchedIcon iconName={R.prop('icon', typeObj)} />}
    />
  )
}

const MapLegendArcToggle = ({
  arcType,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
  const typeObj = R.prop(arcType, useSelector(selectLocalizedArcTypes))
  const IconClass =
    typeObj.lineBy === 'dotted'
      ? AiOutlineEllipsis
      : typeObj.lineBy === 'dashed'
      ? AiOutlineDash
      : typeObj.lineBy === '3d'
      ? VscLoading
      : AiOutlineLine
  return (
    <LegendCard
      geometryType={arcType}
      typeObj={typeObj}
      legendGroupId={legendGroupId}
      sizeProp={sizeProp}
      colorProp={colorProp}
      selectEnabledGeometry={selectEnabledArcs}
      selectGeometryRange={selectArcRange}
      geometryName="arcs"
      icon={<IconClass />}
    />
  )
}

const LegendCard = ({
  geometryType,
  typeObj,
  legendGroupId,
  sizeProp,
  colorProp,
  selectEnabledGeometry,
  selectGeometryRange,
  geometryName, // arcs/nodes/geos
  icon,
}) => {
  // TODO: extend this for geos?
  const dispatch = useDispatch()
  const displayedGeometry = useSelector(selectEnabledGeometry)
  const geometryRange = useSelector(selectGeometryRange)
  const geometryRangesByType = useSelector(selectNodeRangeAtZoom)
  const sync = useSelector(selectSync)
  const appBarId = useSelector(selectAppBarId)

  const basePath = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    geometryName,
    geometryType,
  ]

  const path = R.append('value', basePath)
  const syncToggle = !includesPath(R.values(sync), path)

  const groupPath = R.append('group', basePath)
  const syncGroupToggle = !includesPath(R.values(sync), groupPath)

  const groupCalcColorPath = R.append('groupCalcByColor', basePath)
  const syncGroupCalcColor = !includesPath(R.values(sync), groupCalcColorPath)

  // TODO: Decide how to handle grouping? Allow for arcs or make sure it is
  // only for nodes?
  const allowGrouping = displayedGeometry[geometryType].allowGrouping || false
  const group = displayedGeometry[geometryType].group || false
  const groupCalcBySize =
    displayedGeometry[geometryType].groupCalcBySize || statId.COUNT

  const groupCalcSizePath = R.append('groupCalcBySize', basePath)
  const syncGroupCalcSize = !includesPath(R.values(sync), groupCalcSizePath)
  const groupCalcByColor =
    displayedGeometry[geometryType].groupCalcByColor || statId.COUNT

  const { color: colorDomain, size: sizeDomain } = R.propOr(
    {},
    geometryType,
    geometryRangesByType
  )

  const sizeRange = geometryRange(geometryType, sizeProp, true)
  const colorRange = geometryRange(geometryType, colorProp, false)

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

  return (
    <details key={geometryType} css={nonSx.typeWrapper} open>
      <summary css={nonSx.itemSummary}>
        <MapLegendGroupRowToggleLayer
          icon={icon}
          legendName={R.propOr(geometryType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={eitherBoolOrNotNull(displayedGeometry[geometryType])}
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
      <Grid container spacing={1}>
        <Grid
          item
          container
          xs={5.75}
          sx={{
            alignItems: 'start',
            display: R.isNil(R.prop('sizeByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <MapLegendSizeBySection
            {...{
              sizeProp,
              typeObj,
              icon,
              group,
              geometryName,
              geometryType,
            }}
            sizeRange={group && sizeDomain ? sizeDomain : sizeRange}
            getPropName={getGeometryPropName}
            syncPath={R.append('sizeBy')(basePath)}
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
        </Grid>

        <Grid item xs={0.25}>
          <Divider
            orientation="vertical"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.6)',
              borderStyle: 'dotted',
              pl: 0.15,
            }}
          />
        </Grid>
        <Grid
          item
          container
          xs={5.75}
          sx={{
            alignItems: 'start',
            display: R.isNil(R.prop('colorByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <MapLegendColorBySection
            {...{
              colorProp,
              colorRange,
              typeObj,
              group,
              geometryName,
              geometryType,
            }}
            valueRange={group && colorDomain ? colorDomain : colorRange}
            getPropName={getGeometryPropName}
            getCategoryName={getGeometryCategoryName}
            typeObj={typeObj}
            syncPath={R.append('colorBy')(basePath)}
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
        </Grid>
      </Grid>
    </details>
  )
}

const MapLegendToggleList = ({ legendObj, ...props }) => {
  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)

  const getSortedGroups = (layerKey) =>
    customSort(R.propOr({}, layerKey)(legendObj))

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
      {R.map(({ id: nodeType, value, sizeBy, colorBy }) =>
        R.includes(nodeType, nodeTypes) ? (
          <MapLegendNodeToggle
            key={nodeType}
            legendGroupId={legendObj.id}
            nodeType={nodeType}
            value={value}
            sizeProp={sizeBy}
            colorProp={colorBy}
          />
        ) : (
          []
        )
      )(getSortedGroups('nodes'))}
      {R.map(({ id: arcType, value, sizeBy, colorBy }) =>
        R.includes(arcType, arcTypes) ? (
          <MapLegendArcToggle
            key={arcType}
            legendGroupId={legendObj.id}
            arcType={arcType}
            value={value}
            sizeProp={sizeBy}
            colorProp={colorBy}
          />
        ) : (
          []
        )
      )(getSortedGroups('arcs'))}
      {R.map(({ id: geoType, value, colorBy }) => (
        <MapLegendGeoToggle
          key={geoType}
          legendGroupId={legendObj.id}
          geoType={geoType}
          value={value}
          colorProp={colorBy}
        />
      ))(getSortedGroups('geos'))}
    </details>
  )
}

const MapLegend = () => {
  const legendData = useSelector(selectLegendData)
  const showPitchSlider = useSelector(selectPitchSliderToggle)
  const showBearingSlider = useSelector(selectBearingSliderToggle)
  const mapLegend = useSelector(selectMapLegend)
  const rightBar = useSelector(selectRightAppBarDisplay)
  if (!R.propOr(true, 'isOpen', mapLegend)) return null
  return (
    <Box
      key="map-legend"
      sx={[
        styles.root,
        {
          right: (showPitchSlider ? 100 : 65) + (rightBar ? APP_BAR_WIDTH : 0),
        },
      ]}
    >
      <Box
        sx={[
          styles.paper,
          {
            maxHeight: showBearingSlider
              ? 'calc(100vh - 195px)'
              : 'calc(100vh - 110px)',
          },
        ]}
      >
        <Box sx={{ mx: 0 }}>
          {R.map((legendObj) => (
            <MapLegendToggleList key={legendObj.id} {...{ legendObj }} />
          ))(customSort(legendData))}
        </Box>
      </Box>
    </Box>
  )
}

export default memo(MapLegend)
