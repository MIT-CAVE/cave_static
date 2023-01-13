/** @jsxImportSource @emotion/react */
import { Box, Grid, Switch } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback } from 'react'
import { AiOutlineDash, AiOutlineEllipsis, AiOutlineLine } from 'react-icons/ai'
import { BsSquareFill } from 'react-icons/bs'
import { FaInfinity } from 'react-icons/fa'
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
} from '../../../data/selectors'

import {
  OverflowText,
  SimpleDropdown,
  FetchedIcon,
  getGradientBox,
} from '../../compound'

import { customSort, eitherBoolOrNotNull, includesPath } from '../../../utils'

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
  rightBold: {
    textAlign: 'right',
    fontWeight: 700,
  },
  bold: {
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
  minusOffset: {
    position: 'relative',
    top: '-5px',
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
  },
}

const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}

const CategoricalBox = ({ title, color, getLabel = R.identity }) => (
  <Box sx={{ mx: 0.5 }}>
    {getLabel(title)}
    <br />
    <BsSquareFill css={{ color: color, marginTop: '5px' }} />
  </Box>
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
      <Grid item xs={9} className="my-auto">
        <OverflowText sx={styles.overflowAlignLeft} text={legendName} />
      </Grid>
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
  return (
    <>
      <Grid
        container
        spacing={1}
        alignItems="flex-start"
        justifyContent="center"
      >
        <Grid item xs css={{ textAlign: 'center' }}>
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
      </Grid>
      <Box
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '50%',
          marginBottom: '8px',
        }}
      >
        <Box
          sx={[
            {
              textAlign: 'left',
              marginRight: '10px',
              marginLeft: '10px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            },
            styles.rightBold,
          ]}
        >
          {R.ifElse(
            R.equals(Infinity),
            () => (
              <span>
                <span css={nonSx.minusOffset}>-</span>
                <FaInfinity />
              </span>
            ),
            (x) => x.toFixed(1)
          )(timeProp('min', sizeRange))}
        </Box>
        <Box>
          {addExtraProps(icon, {
            css: {
              width: R.prop('startSize')(typeObj),
              height: R.prop('startSize')(typeObj),
            },
          })}
        </Box>
        <Box sx={[{ ml: 1 }, styles.rightBold]}>
          {addExtraProps(icon, {
            css: {
              width: R.prop('endSize')(typeObj),
              height: R.prop('endSize')(typeObj),
            },
          })}
        </Box>
        <Box sx={[{ textAlign: 'right', mx: 1, fontWeight: 700 }, styles.bold]}>
          {R.ifElse(
            R.equals(-Infinity),
            () => <FaInfinity />,
            (x) => x.toFixed(1)
          )(timeProp('max', sizeRange))}
        </Box>
      </Box>
    </>
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

  return (
    <details key={geoType} css={nonSx.typeWrapper} open>
      <summary css={nonSx.itemSummary}>
        <MapLegendGroupRowToggleLayer
          icon={<FetchedIcon iconName={typeObj.icon} />}
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
        spacing={1}
        alignItems="flex-start"
        css={{ textAlign: 'center' }}
      >
        <Grid item xs>
          <SimpleDropdown
            optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
            getLabel={getGeoPropName}
            value={colorProp}
            onSelect={(value) => {
              dispatch(mutateLocal({ sync: syncColor, path: colorPath, value }))
            }}
          />
        </Grid>
      </Grid>
      {isCategorical ? (
        <Grid container alignItems="flex-start" justifyContent="center">
          {R.values(
            R.mapObjIndexed(
              (val, key) => (
                <Grid item xs css={{ textAlign: 'center' }} key={key}>
                  <CategoricalBox
                    title={key}
                    color={val}
                    getLabel={(str) =>
                      str.charAt(0).toUpperCase() + str.slice(1)
                    }
                  />
                </Grid>
              ),
              colorRange
            )
          )}
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
            maxVal: timeProp('min', colorRange),
            minVal: timeProp('max', colorRange),
          }}
        />
      )}
    </details>
  )
}

const MapLegendNodeToggle = ({
  nodeType,
  typeObj,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
  const dispatch = useDispatch()
  const displayedNodes = useSelector(selectEnabledNodes)
  const nodeRange = useSelector(selectNodeRange)
  const timeProp = useSelector(selectTimeProp)
  const themeType = useSelector(selectTheme)
  const sync = useSelector(selectSync)
  const appBarId = useSelector(selectAppBarId)

  const sizeRange = nodeRange(nodeType, sizeProp, true)
  const colorRange = nodeRange(nodeType, colorProp, false)
  const isCategorical = !R.has('min', colorRange)
  const path = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'nodes',
    nodeType,
    'value',
  ]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'nodes',
    nodeType,
    'colorBy',
  ]
  const syncColor = !includesPath(R.values(sync), colorPath)

  const getNodePropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )

  return (
    <details key={nodeType} css={nonSx.typeWrapper} open>
      <summary css={nonSx.itemSummary}>
        <MapLegendGroupRowToggleLayer
          icon={<FetchedIcon iconName={typeObj.icon} />}
          legendName={R.propOr(nodeType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={eitherBoolOrNotNull(displayedNodes[nodeType])}
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
      <Grid container spacing={1} alignItems="stretch">
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('sizeByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <MapLegendSizeBySection
            sizeProp={sizeProp}
            sizeRange={sizeRange}
            getPropName={getNodePropName}
            typeObj={typeObj}
            typeName={nodeType}
            icon={<FetchedIcon iconName={typeObj.icon} />}
            feature="nodes"
            legendGroup={legendGroupId}
          />
        </Grid>
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('colorByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <Grid container spacing={1} alignItems="flex-start">
            <Grid item xs css={{ textAlign: 'center' }}>
              <SimpleDropdown
                value={colorProp}
                optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
                getLabel={getNodePropName}
                onSelect={(value) => {
                  dispatch(
                    mutateLocal({ sync: syncColor, path: colorPath, value })
                  )
                }}
              />
            </Grid>
          </Grid>
          {isCategorical ? (
            <Grid container alignItems="flex-start" justifyContent="center">
              {R.values(
                R.mapObjIndexed(
                  (val, key) => (
                    <Grid item xs css={{ textAlign: 'center' }} key={key}>
                      <CategoricalBox
                        title={key}
                        color={val}
                        getLabel={(str) =>
                          str.charAt(0).toUpperCase() + str.slice(1)
                        }
                      />
                    </Grid>
                  ),
                  colorRange
                )
              )}
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
                maxVal: timeProp('min', colorRange),
                minVal: timeProp('max', colorRange),
              }}
            />
          )}
        </Grid>
      </Grid>
    </details>
  )
}

const MapLegendArcToggle = ({
  arcType,
  typeObj,
  legendGroupId,
  sizeProp,
  colorProp,
}) => {
  const dispatch = useDispatch()
  const displayedArcs = useSelector(selectEnabledArcs)
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const timeProp = useSelector(selectTimeProp)
  const sync = useSelector(selectSync)
  const appBarId = useSelector(selectAppBarId)

  const IconClass =
    typeObj.lineBy === 'dotted'
      ? AiOutlineEllipsis
      : typeObj.lineBy === 'dashed'
      ? AiOutlineDash
      : typeObj.lineBy === '3d'
      ? VscLoading
      : AiOutlineLine

  const sizeRange = arcRange(arcType, sizeProp, true)
  const colorRange = arcRange(arcType, colorProp, false)
  const isCategorical = !R.has('min', colorRange)
  const path = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'arcs',
    arcType,
    'value',
  ]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = [
    'maps',
    'data',
    appBarId,
    'legendGroups',
    legendGroupId,
    'arcs',
    arcType,
    'colorBy',
  ]
  const syncColor = !includesPath(R.values(sync), colorPath)
  const getArcPropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )
  return (
    <details key={arcType} css={nonSx.typeWrapper} open>
      <summary css={nonSx.itemSummary}>
        <MapLegendGroupRowToggleLayer
          icon={<IconClass />}
          legendName={R.propOr(arcType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={eitherBoolOrNotNull(displayedArcs[arcType])}
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
      <Grid container spacing={1} alignItems="stretch">
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('sizeByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <MapLegendSizeBySection
            sizeProp={sizeProp}
            sizeRange={sizeRange}
            getPropName={getArcPropName}
            typeObj={typeObj}
            typeName={arcType}
            icon={<IconClass />}
            feature="arcs"
            legendGroup={legendGroupId}
          />
        </Grid>
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('colorByOptions')(typeObj)) ? 'none' : '',
          }}
        >
          <Grid container spacing={1} alignItems="flex-start">
            <Grid item xs css={{ textAlign: 'center' }}>
              <SimpleDropdown
                value={colorProp}
                optionsList={R.keys(R.prop('colorByOptions')(typeObj))}
                getLabel={getArcPropName}
                onSelect={(value) => {
                  dispatch(
                    mutateLocal({ sync: syncColor, path: colorPath, value })
                  )
                }}
              />
            </Grid>
          </Grid>
          {isCategorical ? (
            <Grid container alignItems="flex-start" justifyContent="center">
              {R.values(
                R.mapObjIndexed(
                  (val, key) => (
                    <Grid item xs css={{ textAlign: 'center' }} key={key}>
                      <CategoricalBox
                        title={key}
                        color={val}
                        getLabel={(str) =>
                          str.charAt(0).toUpperCase() + str.slice(1)
                        }
                      />
                    </Grid>
                  ),
                  colorRange
                )
              )}
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
                maxVal: timeProp('min', colorRange),
                minVal: timeProp('max', colorRange),
              }}
            />
          )}
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
      {R.map(({ id: nodeType, value, sizeBy, colorBy }) => (
        <MapLegendNodeToggle
          key={nodeType}
          legendGroupId={legendObj.id}
          nodeType={nodeType}
          value={value}
          sizeProp={resolveTime(sizeBy)}
          colorProp={resolveTime(colorBy)}
          typeObj={R.prop(nodeType)(nodeTypes)}
        />
      ))(getSortedGroups('nodes'))}
      {R.map(({ id: arcType, value, sizeBy, colorBy }) => (
        <MapLegendArcToggle
          key={arcType}
          legendGroupId={legendObj.id}
          arcType={arcType}
          value={value}
          sizeProp={resolveTime(sizeBy)}
          colorProp={resolveTime(colorBy)}
          typeObj={R.prop(arcType)(arcTypes)}
        />
      ))(getSortedGroups('arcs'))}
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
