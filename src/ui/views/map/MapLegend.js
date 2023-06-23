/** @jsxImportSource @emotion/react */
import {
  Box,
  Grid,
  Paper,
  Switch,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback } from 'react'
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
  selectTimeProp,
  selectLegendData,
  selectLocalizedArcTypes,
  selectLocalizedNodeTypes,
  selectLocalizedGeoTypes,
  selectSync,
  selectPitchSliderToggle,
  selectAppBarId,
  selectResolveTime,
  selectNodeClustersAtZoom,
} from '../../../data/selectors'
import { statId } from '../../../utils/enums'
import { getStatLabel } from '../../../utils/stats'

import {
  OverflowText,
  SimpleDropdown,
  FetchedIcon,
  getGradientBox,
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
    width: 500,
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    p: (theme) => theme.spacing(0, 4, 3),
    overflowY: 'auto',
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
  getCategoryIcon: (layerKey) => ({
    m: 0.5,
    p: 0.5,
    minWidth: '16px',
    minHeight: '16px',
    ...(layerKey === 'arcs' // thin rectangle
      ? {
          borderRadius: 0,
          minHeight: '4px',
        }
      : layerKey === 'nodes' // circle
      ? {
          borderRadius: '50%',
        }
      : {
          borderRadius: 1,
        }), // Rounded-border square
    cursor: 'pointer',
    // Uncomment if labels are placed inside the color icons
    // maxWidth: '16ch',
    // textOverflow: 'ellipsis',
    // overflow: 'hidden',
    // textAlign: 'center',
  }),
  categoricalItems: {
    maxHeight: '96px',
    overflow: 'auto',
    lineHeight: '16px',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  unit: {
    display: 'flex',
    alignSelf: 'end',
    ml: 1.5,
    mb: 1,
    px: 1.25,
    border: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
    wordBreak: 'break-word',
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
    padding: '5px',
    paddingTop: '10px',
    marginTop: '10px',
    borderRadius: '8px',
    // backgroundColor: '#383838',
  },
}

const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}

const getMinMaxLabel = (
  valRange,
  timeProp,
  valProp,
  typeObj,
  end,
  labelEnd
) => {
  return R.pathOr(
    R.path(['props', valProp, 'legendOverride', 'useScientificFormat'])(
      typeObj
    ) ?? true
      ? serializeNumLabel(
          timeProp(end, valRange),
          R.path(['props', valProp, 'legendOverride', 'scientificPrecision'])(
            typeObj
          )
        )
      : formatNumber(
          timeProp(end, valRange),
          R.pipe(
            R.path(['props', valProp, 'numberFormat']),
            R.dissoc('unit')
          )(typeObj)
        ),
    ['props', valProp, 'legendOverride', labelEnd]
  )(typeObj)
}

const getMinLabel = (valRange, timeProp, valProp, typeObj) => {
  return getMinMaxLabel(valRange, timeProp, valProp, typeObj, 'min', 'minLabel')
}

const getMaxLabel = (valRange, timeProp, valProp, typeObj) => {
  return getMinMaxLabel(valRange, timeProp, valProp, typeObj, 'max', 'maxLabel')
}

const CategoricalItems = ({ layerKey, colorRange, getLabel = capitalize }) =>
  R.values(
    R.mapObjIndexed(
      (val, key) => (
        <Tooltip title={getLabel(key)}>
          <Paper
            key={key}
            sx={[styles.getCategoryIcon(layerKey), { bgcolor: val }]}
            elevation={3}
          >
            {/* {getLabel(key)} */}
          </Paper>
        </Tooltip>
      ),
      colorRange
    )
  )

const GradientBox = ({ gradientBox }) => (
  <div className="row my-2">
    <div className="col-12 mx-auto">
      {getGradientBox(
        gradientBox.maxColor,
        gradientBox.minColor,
        gradientBox.maxVal,
        gradientBox.minVal
      )}
    </div>
  </div>
)

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

const MapLegendSizeBySection = ({
  sizeProp,
  sizeRange,
  getPropName,
  typeObj,
  typeName,
  icon,
  feature,
  legendGroup,
}) => {
  const dispatch = useDispatch()
  const timeProp = useSelector(selectTimeProp)
  const sync = useSelector(selectSync)
  const appBarId = useSelector(selectAppBarId)

  const path = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroup,
    feature,
    typeName,
    'sizeBy',
  ]
  const syncSize = !includesPath(R.values(sync), path)

  const unit = R.path(['props', sizeProp, 'numberFormat', 'unit'])(typeObj)

  return (
    <Grid container>
      <Grid item container alignItems="center" justifyContent="center" xs={6}>
        <Grid item xs>
          <SimpleDropdown
            value={sizeProp}
            getLabel={getPropName}
            optionsList={R.keys(R.prop('sizeByOptions')(typeObj))}
            onSelect={(value) => {
              dispatch(
                mutateLocal({ path: path, sync: syncSize, value: value })
              )
            }}
          />
        </Grid>
        {unit && (
          <Grid item>
            <Typography variant="subtitle1" sx={styles.unit}>
              {unit}
            </Typography>
          </Grid>
        )}
      </Grid>
      <Grid item container alignItems="center" justifyContent="center" xs={6}>
        <Grid item sx={{ pr: 1, fontWeight: 700, textAlign: 'right' }} xs={3.5}>
          <OverflowText
            text={getMinLabel(sizeRange, timeProp, sizeProp, typeObj)}
          />
        </Grid>
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
        <Grid item sx={{ pl: 1, fontWeight: 700, textAlign: 'left' }} xs={3.5}>
          <OverflowText
            text={getMaxLabel(sizeRange, timeProp, sizeProp, typeObj)}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}

const MapLegendGeoToggle = ({ geoType, typeObj, legendGroupId, colorProp }) => {
  const dispatch = useDispatch()
  const timeProp = useSelector(selectTimeProp)
  const themeType = useSelector(selectTheme)
  const geoColorRange = useSelector(selectGeoColorRange)
  const displayedGeos = useSelector(selectEnabledGeos)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)

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
      <Grid container spacing={1} alignItems="center" justifyContent="center">
        <SimpleDropdown
          optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
          getLabel={getGeoPropName}
          value={colorProp}
          onSelect={(value) => {
            dispatch(mutateLocal({ sync: syncColor, path: colorPath, value }))
          }}
        />
      </Grid>
      {isCategorical ? (
        <Grid container sx={styles.categoricalItems}>
          <CategoricalItems
            layerKey="geos"
            getLabel={getGeoCategoryName}
            {...{ colorRange }}
          />
        </Grid>
      ) : (
        <GradientBox
          gradientBox={{
            minColor: R.pathOr(
              R.prop('startGradientColor', colorRange),
              ['startGradientColor', themeType],
              colorRange
            ),
            maxColor: R.pathOr(
              R.prop('endGradientColor', colorRange),
              ['endGradientColor', themeType],
              colorRange
            ),
            maxVal: getMaxLabel(colorRange, timeProp, colorProp, typeObj),
            minVal: getMinLabel(colorRange, timeProp, colorProp, typeObj),
          }}
        />
      )}
    </details>
  )
}

const GroupCalcDropdown = ({ value, onSelect, ...props }) => (
  <Grid
    container
    item
    justifyContent="center"
    alignItems="center"
    // spacing={1}
    {...props}
  >
    <Grid item>
      <FetchedIcon iconName="TbMathFunction" size={24} />
    </Grid>
    <Grid item>
      <SimpleDropdown
        getLabel={getStatLabel}
        optionsList={R.values(statId)}
        {...{ value, onSelect }}
      />
    </Grid>
  </Grid>
)

const MapLegendNodeToggle = ({
  nodeType,
  typeObj,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
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
  typeObj,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
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
  const timeProp = useSelector(selectTimeProp)
  const themeType = useSelector(selectTheme)
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

  const geometryRangesByType = R.propOr(
    {},
    'range',
    useSelector(selectNodeClustersAtZoom)
  )
  const { color: colorDomain, size: sizeDomain } = R.propOr(
    {},
    geometryType,
    geometryRangesByType
  )

  const colorPath = R.append('colorBy', basePath)
  const syncColor = !includesPath(R.values(sync), colorPath)

  const sizeRange = geometryRange(geometryType, sizeProp, true)
  const colorRange = geometryRange(geometryType, colorProp, false)
  const isCategorical = !R.has('min', colorRange)

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
                  iconName={group ? 'FaRegObjectGroup' : 'FaRegObjectUngroup'}
                  size={26}
                  color="text.primary"
                />
              </ToggleButton>
            ),
          })}
        />
      </summary>
      <hr />
      <Grid container spacing={1} alignItems="stretch">
        <Grid
          container
          item
          xs={12}
          css={{
            display: R.isNil(R.prop('sizeByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <MapLegendSizeBySection
            sizeProp={sizeProp}
            sizeRange={group && sizeDomain ? sizeDomain : sizeRange}
            getPropName={getGeometryPropName}
            typeObj={typeObj}
            typeName={geometryType}
            icon={icon}
            feature={geometryName}
            legendGroup={legendGroupId}
          />
          {group && (
            <GroupCalcDropdown
              value={groupCalcBySize}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path: groupCalcSizePath,
                    sync: syncGroupCalcSize,
                    value,
                  })
                )
              }}
            />
          )}
        </Grid>

        <Grid
          container
          item
          xs={12}
          css={{
            display: R.isNil(R.prop('colorByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <Grid container alignItems="center">
            <Grid
              container
              item
              xs
              alignItems="stretch"
              justifyContent="center"
            >
              <SimpleDropdown
                value={colorProp}
                optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
                getLabel={getGeometryPropName}
                onSelect={(value) => {
                  dispatch(
                    mutateLocal({ sync: syncColor, path: colorPath, value })
                  )
                }}
              />
            </Grid>
            <Grid container item xs alignItems="center">
              {isCategorical ? (
                <Grid container sx={styles.categoricalItems}>
                  <CategoricalItems
                    layerKey={geometryName}
                    getLabel={getGeometryCategoryName}
                    {...{ colorRange }}
                  />
                </Grid>
              ) : (
                <GradientBox
                  gradientBox={{
                    minColor: R.pathOr(
                      R.prop('startGradientColor', colorRange),
                      ['startGradientColor', themeType],
                      colorRange
                    ),
                    maxColor: R.pathOr(
                      R.prop('endGradientColor', colorRange),
                      ['endGradientColor', themeType],
                      colorRange
                    ),
                    maxVal: getMaxLabel(
                      group && colorDomain ? colorDomain : colorRange,
                      timeProp,
                      colorProp,
                      typeObj
                    ),
                    minVal: getMinLabel(
                      group && colorDomain ? colorDomain : colorRange,
                      timeProp,
                      colorProp,
                      typeObj
                    ),
                  }}
                />
              )}
              {group && (
                <GroupCalcDropdown
                  value={groupCalcByColor}
                  onSelect={(value) => {
                    dispatch(
                      mutateLocal({
                        path: groupCalcColorPath,
                        sync: syncGroupCalcColor,
                        value,
                      })
                    )
                  }}
                />
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </details>
  )
}

const MapLegendToggleList = ({ legendObj, ...props }) => {
  const resolveTime = useSelector(selectResolveTime)

  const nodeTypes = useSelector(selectLocalizedNodeTypes)
  const arcTypes = useSelector(selectLocalizedArcTypes)
  const geoTypes = useSelector(selectLocalizedGeoTypes)

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
        R.has(nodeType, nodeTypes) ? (
          <MapLegendNodeToggle
            key={nodeType}
            legendGroupId={legendObj.id}
            nodeType={nodeType}
            value={value}
            sizeProp={resolveTime(sizeBy)}
            colorProp={resolveTime(colorBy)}
            typeObj={R.prop(nodeType)(nodeTypes)}
          />
        ) : (
          []
        )
      )(getSortedGroups('nodes'))}
      {R.map(({ id: arcType, value, sizeBy, colorBy }) =>
        R.has(arcType, arcTypes) ? (
          <MapLegendArcToggle
            key={arcType}
            legendGroupId={legendObj.id}
            arcType={arcType}
            value={value}
            sizeProp={resolveTime(sizeBy)}
            colorProp={resolveTime(colorBy)}
            typeObj={R.prop(arcType)(arcTypes)}
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
          colorProp={resolveTime(colorBy)}
          typeObj={R.prop(geoType)(geoTypes)}
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
  if (!R.propOr(true, 'isOpen', mapLegend)) return null

  return (
    <Box
      key="map-legend"
      sx={[styles.root, { right: showPitchSlider ? 100 : 65 }]}
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
