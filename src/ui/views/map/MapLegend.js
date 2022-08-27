/** @jsxImportSource @emotion/react */
import { Grid, Switch } from '@mui/material'
import { makeStyles } from '@mui/styles'
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
} from '../../../data/selectors'

import {
  OverflowText,
  SimpleDropdown,
  FetchedIcon,
  getGradientBox,
} from '../../compound'

import { includesPath } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100px',
    flexGrow: 1,
    minWidth: 300,
    transform: 'translateZ(0)',
    // The position fixed scoping doesn't work in IE 11.
    '@media all and (-ms-high-contrast: none)': {
      display: 'none',
    },
  },
  modal: {
    display: 'flex',
    padding: '20px',
    alignItems: 'right',
    justifyContent: 'center',
  },
  paper: {
    width: 500,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.text.secondary}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(0, 4, 3),
    overflowY: 'auto',
  },
  react_icon: {
    color: theme.palette.text.primary,
    cursor: 'pointer',
  },
}))

const localCss = {
  legend_root: {
    overflowY: 'hidden',
    position: 'absolute',
    top: '10px',
    right: '65px',
    zIndex: 1,
  },
  flex_space_between: {
    marginBottom: '-20px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  toggle_layer_icon: {
    marginLeft: '10px',
  },
  overflow_align_left: {
    textAlign: 'left',
    fontSize: '20px',
  },
  list_title: {
    fontSize: '25px',
    fontWeight: 700,
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  type_wrapper: {
    border: '1px solid',
    padding: '5px',
    paddingTop: '10px',
    marginTop: '10px',
    borderRadius: '8px',
  },
  right_bold: {
    textAlign: 'right',
    fontWeight: 700,
  },
  bold: {
    fontWeight: 700,
  },
  section_header: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '10px',
    marginBottom: '10px',
  },
  section_header_child: {
    flex: '1 1 auto',
  },
  item_summary: {
    cursor: 'pointer',
    display: 'block',
  },
  categorical_box: {
    marginLeft: '5px',
    marginRight: '5px',
  },
  primary_details: {
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
  minus_offset: {
    position: 'relative',
    top: '-5px',
  },
}

const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}

const CategoricalBox = ({ title, color, getLabel = R.identity }) => (
  <div css={localCss.categorical_box}>
    {getLabel(title)}
    <br />
    <BsSquareFill css={{ color: color, marginTop: '5px' }} />
  </div>
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
        <div css={localCss.toggle_layer_icon}>{icon}</div>
      </Grid>
      <Grid item xs={2} className="my-auto ml-0">
        {toggle}
      </Grid>
      <Grid item xs={9} className="my-auto">
        <OverflowText css={localCss.overflow_align_left} text={legendName} />
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
}) => {
  const dispatch = useDispatch()
  const timeProp = useSelector(selectTimeProp)
  const sync = useSelector(selectSync)

  const path = [feature, 'types', typeName, 'sizeBy']

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
      <div
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '50%',
          marginBottom: '8px',
        }}
      >
        <div
          css={{
            textAlign: 'left',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            ...localCss.right_bold,
          }}
        >
          {R.ifElse(
            R.equals(Infinity),
            () => (
              <span>
                <span css={localCss.minus_offset}>-</span>
                <FaInfinity />
              </span>
            ),
            (x) => x.toFixed(1)
          )(timeProp('min', sizeRange))}
        </div>
        <div>
          {addExtraProps(icon, {
            css: {
              width: R.prop('startSize')(typeObj),
              height: R.prop('startSize')(typeObj),
            },
          })}
        </div>
        <div css={{ marginLeft: '10px', ...localCss.right_bold }}>
          {addExtraProps(icon, {
            css: {
              width: R.prop('endSize')(typeObj),
              height: R.prop('endSize')(typeObj),
            },
          })}
        </div>
        <div
          css={{
            textAlign: 'right',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            ...localCss.bold,
          }}
        >
          {R.ifElse(
            R.equals(-Infinity),
            () => <FaInfinity />,
            (x) => x.toFixed(1)
          )(timeProp('max', sizeRange))}
        </div>
      </div>
    </>
  )
}

const MapLegendGeoToggle = ({ geoType, typeObj }) => {
  const dispatch = useDispatch()
  const timeProp = useSelector(selectTimeProp)
  const themeType = useSelector(selectTheme)
  const geoColorRange = useSelector(selectGeoColorRange)
  const displayedGeos = useSelector(selectEnabledGeos)
  const sync = useSelector(selectSync)

  const colorProp = timeProp('colorBy')(typeObj)

  const colorRange = geoColorRange(geoType, colorProp)
  const isCategorical = !R.has('min', colorRange)

  const path = ['map', 'data', 'enabledTypes', 'geo', geoType]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = ['geos', 'types', geoType, 'colorBy']
  const syncColor = !includesPath(R.values(sync), colorPath)

  const getGeoPropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )

  return (
    <details key={geoType} css={localCss.type_wrapper} open>
      <summary css={localCss.item_summary}>
        <MapLegendGroupRowToggleLayer
          icon={<FetchedIcon iconName={typeObj.icon} />}
          legendName={R.propOr(geoType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={R.propOr(false, geoType, displayedGeos)}
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

const MapLegendNodeToggle = ({ nodeType, typeObj }) => {
  const dispatch = useDispatch()
  const displayedNodes = useSelector(selectEnabledNodes)
  const nodeRange = useSelector(selectNodeRange)
  const timeProp = useSelector(selectTimeProp)
  const themeType = useSelector(selectTheme)
  const sync = useSelector(selectSync)

  const sizeProp = timeProp('sizeBy')(typeObj)

  const colorProp = timeProp('colorBy')(typeObj)

  const sizeRange = nodeRange(nodeType, sizeProp, true)
  const colorRange = nodeRange(nodeType, colorProp, false)
  const isCategorical = !R.has('min', colorRange)
  const path = ['map', 'data', 'enabledTypes', 'node', nodeType]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = ['nodes', 'types', nodeType, 'colorBy']
  const syncColor = !includesPath(R.values(sync), colorPath)

  const getNodePropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )

  return (
    <details key={nodeType} css={localCss.type_wrapper} open>
      <summary css={localCss.item_summary}>
        <MapLegendGroupRowToggleLayer
          icon={<FetchedIcon iconName={typeObj.icon} />}
          legendName={R.propOr(nodeType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={R.propOr(false, nodeType, displayedNodes)}
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
            display: R.isNil(R.prop('sizeBy')(typeObj)) ? 'none' : '',
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
          />
        </Grid>
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('colorBy')(typeObj)) ? 'none' : '',
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

const MapLegendArcToggle = ({ arcType, typeObj }) => {
  const dispatch = useDispatch()
  const displayedArcs = useSelector(selectEnabledArcs)
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const timeProp = useSelector(selectTimeProp)
  const sync = useSelector(selectSync)

  const IconClass =
    typeObj.lineBy === 'dotted'
      ? AiOutlineEllipsis
      : typeObj.lineBy === 'dashed'
      ? AiOutlineDash
      : typeObj.lineBy === '3d'
      ? VscLoading
      : AiOutlineLine
  const sizeProp = timeProp('sizeBy')(typeObj)

  const colorProp = timeProp('colorBy')(typeObj)
  const sizeRange = arcRange(arcType, sizeProp, true)
  const colorRange = arcRange(arcType, colorProp, false)
  const isCategorical = !R.has('min', colorRange)
  const path = ['map', 'data', 'enabledTypes', 'arc', arcType]
  const syncToggle = !includesPath(R.values(sync), path)

  const colorPath = ['arcs', 'types', arcType, 'colorBy']
  const syncColor = !includesPath(R.values(sync), colorPath)

  const getArcPropName = useCallback(
    (prop) => R.pathOr(prop, ['props', prop, 'name'], typeObj),
    [typeObj]
  )

  return (
    <details key={arcType} css={localCss.type_wrapper} open>
      <summary css={localCss.item_summary}>
        <MapLegendGroupRowToggleLayer
          icon={<IconClass />}
          legendName={R.propOr(arcType, 'name')(typeObj)}
          toggle={
            <Switch
              checked={R.propOr(false, arcType, displayedArcs)}
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
            display: R.isNil(R.prop('sizeBy')(typeObj)) ? 'none' : '',
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
          />
        </Grid>
        <Grid
          item
          xs
          css={{
            display: R.isNil(R.prop('colorBy')(typeObj)) ? 'none' : '',
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
  const nodeTypes = useSelector(selectLocalizedNodeTypes)
  const arcTypes = useSelector(selectLocalizedArcTypes)
  const geoTypes = useSelector(selectLocalizedGeoTypes)

  return (
    <details {...props} open css={localCss.primary_details}>
      <summary css={localCss.list_title}>
        <span>{R.prop('name', legendObj)}</span>
        <MdExpandMore />
        <MdExpandLess />
        <span>
          <hr />
          {'...'}
          <br />
          <hr />
        </span>
      </summary>
      {R.map((nodeType) => (
        <MapLegendNodeToggle
          key={nodeType}
          nodeType={nodeType}
          typeObj={R.prop(nodeType)(nodeTypes)}
        />
      ))(R.propOr([], 'nodeTypes', legendObj))}
      {R.map((arcType) => (
        <MapLegendArcToggle
          key={arcType}
          arcType={arcType}
          typeObj={R.prop(arcType)(arcTypes)}
        />
      ))(R.propOr([], 'arcTypes', legendObj))}
      {R.map((geoType) => (
        <MapLegendGeoToggle
          key={geoType}
          geoType={geoType}
          typeObj={R.prop(geoType)(geoTypes)}
        />
      ))(R.propOr([], 'geoTypes', legendObj))}
    </details>
  )
}

const MapLegend = () => {
  const classes = useStyles()
  const legendData = useSelector(selectLegendData)

  const showBearingSlider = useSelector(selectBearingSliderToggle)
  const mapLegend = useSelector(selectMapLegend)
  if (!mapLegend.isOpen) return null

  return (
    <div key="Map Legend" css={localCss.legend_root}>
      <div
        className={classes.paper}
        css={{
          maxHeight: showBearingSlider
            ? 'calc(100vh - 210px)'
            : 'calc(100vh - 120px)',
        }}
      >
        <div css={{ marginLeft: 0, marginRight: 0 }}>
          {R.map((legendObj) => (
            <MapLegendToggleList
              legendObj={legendObj}
              key={R.prop('name', legendObj)}
            />
          ))(legendData)}
        </div>
      </div>
    </div>
  )
}

export default memo(MapLegend)
