/**
 * Based on:
 * https://github.com/visgl/deck.gl/blob/8.8-release/examples/website/icon/icon-cluster-layer.js
 */
import { CompositeLayer } from '@deck.gl/core'
import { IconLayer } from '@deck.gl/layers'
import Supercluster from 'supercluster'

const getValue = (d, prop, defaultValue = 1) => {
  if (prop) {
    return d.properties[prop]
  }
  if (d.properties.cluster) {
    return d.properties.point_count
  }
  return defaultValue
}

/**
 * Splits a list into sub-lists stored in an object, based on the result of
 * applying a function on each element.
 */
const getGroups = (data, fn) =>
  data.reduce((acc, d) => {
    const result = fn(d)
    acc[result] = acc[result] || []
    acc[result].push(d)
    return acc
  }, {})

// Find clusters and size limits of the icons at each zoom level
const getRangeObj = (arr) =>
  arr.reduce(
    ({ min, max }, value) => ({
      min: Math.min(value, min),
      max: Math.max(value, max),
    }),
    { min: Infinity, max: -Infinity }
  )

/**
 * @todo Write the documentation by following JSDoc 3.
 */
export default class IconClusterLayer extends CompositeLayer {
  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged
  }

  updateState({ props, oldProps, changeFlags }) {
    const rebuildIndex =
      changeFlags.dataChanged ||
      props.radius !== oldProps.radius ||
      props.colorBy !== oldProps.colorBy ||
      props.iconProp !== oldProps.iconProp ||
      props.colorGroupFn !== oldProps.colorGroupFn ||
      props.sizeGroupFn !== oldProps.sizeGroupFn ||
      props.data !== oldProps.data

    const {
      data,
      groupBy,
      iconProp,
      getColorProp,
      getSizeProp,
      getColorGroupFn,
      getSizeGroupFn,
    } = props

    if (rebuildIndex) {
      // Set the "supercluster" constructor parameters
      const options = {
        minZoom: 0,
        maxZoom: 20,
        radius: props.radius * Math.sqrt(2),
        map: (d) => {
          const colorProp = getColorProp(d)
          const sizeProp = getSizeProp(d)

          const sizePropObj = {
            [sizeProp]: sizeProp
              ? {
                  value: [d.props[sizeProp].value],
                  startSize: d.startSize,
                  endSize: d.endSize,
                }
              : {},
          }
          const colorPropObj = {
            [colorProp]: colorProp
              ? {
                  value: [d.props[colorProp].value],
                }
              : {},
          }
          return {
            type: d.type,
            colorDomain: null,
            sizeDomain: null,
            ...(iconProp ? { [iconProp]: d[iconProp] } : {}),
            ...(colorProp !== sizeProp
              ? { ...colorPropObj, ...sizePropObj }
              : // Make sure to preserve `sizeProp`'s additional properties
                sizePropObj),
          }
        },
        reduce: (acc, dProps) => {
          const colorProp = getColorProp(dProps)
          const sizeProp = getSizeProp(dProps)
          if (sizeProp) {
            const propValue = dProps[sizeProp].value
            acc[sizeProp].value = acc[sizeProp].value.concat(propValue)
          }

          // BUG: At some point, I noticed that there are more values
          // in the resulting array than the actual points in the cluster,
          // e.g. a cluster with two nodes with values 100 and 50 might end
          // up with an array of values of [100, 50, 60].
          // Not sure if this bug went away after some other fixes
          if (colorProp && colorProp !== sizeProp) {
            const propValue = dProps[colorProp].value
            acc[colorProp].value = acc[colorProp].value.concat(propValue)
          }
        },
      }

      const groupsRaw = Object.values(getGroups(data, groupBy))
      const index = new Supercluster(options)
      const groups = {}
      if (data.length > 0) {
        for (let z = options.maxZoom; z >= options.minZoom; z--) {
          const clusters = groupsRaw.reduce((acc, dataGroup) => {
            let points = dataGroup.map((d) => ({
              geometry: { coordinates: props.getPosition(d) },
              properties: d,
            }))

            index.load(points)
            const groupClustersRaw = index.getClusters([-180, -85, 180, 85], z)

            /* Domain calculations start */

            // NOTE(@Willem):
            // Below, the idea is to obtain a `colorDomain` and `sizeDomain` (min's & max's) after
            // applying the respective grouping calculation functions to each groupCluster.
            // These domains will be then added to the `properties` key of the `groupClustersRaw`
            // resulting data from `supercluster`.
            // These domains will be the new min's and max's that we use to interpolate color
            // and sizes for each cluster or isolated node, as well as displaying in the legend.
            // Feel free to restructure the whole process. Just leaving this here in case some
            // parts of it could be useful.

            // console.log({ points, groupClusters, dataGroup })

            // The props that we use in the legend for colorBy and sizeBy for a specific node type
            const colorProp = getColorProp(dataGroup[0])
            const sizeProp = getSizeProp(dataGroup[0])

            const getDomainValues = (prop, groupCalculationFn) =>
              groupClustersRaw.map((d) =>
                d.properties.cluster
                  ? groupCalculationFn(d.properties[prop].value)
                  : // Nodes that were not within the radius to form a cluster
                    d.properties.props[prop].value
              )

            // All elements of a `groupClusters` contain the same `nodeType`
            // required to get the corresponding calculationGroup (color or size)
            const colorGroupFn = getColorGroupFn(dataGroup[0])
            const sizeGroupFn = getSizeGroupFn(dataGroup[0])

            const colorValues = getDomainValues(colorProp, colorGroupFn)
            const sizeValues = getDomainValues(sizeProp, sizeGroupFn)
            // console.log({ colorValues, sizeValues })

            const colorDomain = getRangeObj(colorValues)
            const sizeDomain = getRangeObj(sizeValues)
            // console.log({ colorDomain, sizeDomain })

            const groupClusters = groupClustersRaw.map((groupCluster) => {
              groupCluster.properties.colorDomain = colorDomain
              groupCluster.properties.sizeDomain = sizeDomain
              return groupCluster
            })
            // console.log({ colorDomain, sizeDomain, groupClusters })

            /* Domain calculations end */

            // Aggregate clusters into a single data structure
            return acc.concat(groupClusters)
          }, [])

          // console.log({ groupsRaw, clusters })

          groups[z] = { data: clusters }
        }
        // console.log({ ...groups })
      } else this.setState({ data: [] })

      this.setState({ groups })
    }

    const z = Math.floor(this.context.viewport.zoom)
    if (rebuildIndex || z !== this.state.z) {
      this.setState({ ...this.state.groups[z], z })
    }
  }

  // // TODO
  // getPickingInfo({ info, mode }) {
  //   console.log('hovering', info, mode)
  //   const pickedObject = info.object && info.object.properties
  //   if (pickedObject) {
  //     const { iconProp, sizeProp, sizeMinPixels, sizeMaxPixels } = this.props
  //     const { minPropValue, maxPropValue } = this.state
  //     const getBoundSize = (value) =>
  //       maxPropValue > minPropValue
  //         ? ((sizeMaxPixels - sizeMinPixels) / (maxPropValue - minPropValue)) *
  //             (value - minPropValue) +
  //           sizeMinPixels
  //         : (sizeMaxPixels + sizeMinPixels) / 2
  //     info.object.rawSize = getValue(info.object, sizeProp || iconProp)
  //     info.object.size = getBoundSize(info.object.rawSize)
  //   }
  //   return info
  // }

  /**
   * @todo Write the documentation by following JSDoc 3.
   * @param {string} sizeProp - The property name which value determines the
   * size of the icon marker.
   * @param {string} iconProp - The property name which value determines the
   * marker that will be pulled out from the iconAtlas.
   */
  renderLayers() {
    const {
      iconAtlasLabel,
      iconAtlasMarker,
      iconMappingLabel,
      iconMappingMarker,
      iconProp,
      sizeProp,
      sizeScale,
      getIconLabel,
      colorBy,
      sizeBy,
    } = this.props
    const { data } = this.state

    return [
      new IconLayer(
        this.getSubLayerProps({
          id: 'icon-layer-marker',
          pickable: true,
          autoHighlight: true,
          data,
          sizeScale,
          iconAtlas: iconAtlasMarker,
          iconMapping: iconMappingMarker,
          getPosition: (d) => d.geometry.coordinates,
          getIcon: (d) => getValue(d, iconProp),
          getSize: (d) => sizeBy(d.properties),
          getColor: (d) => colorBy(d.properties),
          updateTriggers: {
            getColor: [colorBy],
            getSize: [sizeProp, iconProp],
          },
        })
      ),
      // NOTE: Might be a better option to replace the `IconLayer` below with a `TextLayer`
      new IconLayer(
        this.getSubLayerProps({
          id: 'icon-layer-label',
          data,
          sizeScale,
          iconAtlas: iconAtlasLabel,
          iconMapping: iconMappingLabel,
          getPosition: (d) => d.geometry.coordinates,
          getIcon: (d) => getIconLabel(getValue(d)), // Nodes count
          // getColor: (d) => colorBy(d.properties),
          updateTriggers: {
            getIcon: [iconProp],
            getSize: [sizeProp, iconProp],
          },
        })
      ),
    ]
  }
}
