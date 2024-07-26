import earcut from 'earcut'
import { MercatorCoordinate } from 'maplibre-gl'
import * as R from 'ramda'
import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdDownloading } from 'react-icons/md'
import { Layer, useMap } from 'react-map-gl'
import { useSelector } from 'react-redux'
import * as THREE from 'three'

import { selectSettingsIconUrl } from '../../../data/selectors'
import { HIGHLIGHT_COLOR, ICON_RESOLUTION } from '../../../utils/constants'

import { rgbStrToArray, fetchIcon } from '../../../utils'

// Generate custom cylinder segments to allow for size scaling
const generateSegments = (curve, feature, segments = 80) => {
  const lineType = R.pathOr('solid', ['properties', 'dash'], feature)
  const color = R.pathOr('rgba(0,0,0,255)', ['properties', 'color'], feature)
  const size = R.pathOr(30, ['properties', 'size'], feature)

  const points = curve.getPoints(segments)
  return R.reduce((acc, idx) => {
    // Skip every other segment for dashed line
    if (lineType === 'dashed' && idx % 2 === 0) return acc

    // Generate midpoint to place cylinder center
    const midpoint = new THREE.Vector3(
      (points[idx].x + points[idx + 1].x) / 2,
      (points[idx].y + points[idx + 1].y) / 2,
      (points[idx].z + points[idx + 1].z) / 2
    )
    // find distance between 2 points
    const hypotenuse = Math.sqrt(
      Math.pow(points[idx].x - points[idx + 1].x, 2) +
        Math.pow(points[idx].y - points[idx + 1].y, 2) +
        Math.pow(points[idx].z - points[idx + 1].z, 2)
    )
    // find vertical angle between 2 points (uses iso names)
    const theta = Math.asin((points[idx].z - points[idx + 1].z) / hypotenuse)
    // find horizontal angle between 2 points
    const phi =
      Math.atan2(
        points[idx].y - points[idx + 1].y,
        points[idx].x - points[idx + 1].x
      ) +
      Math.PI / 2
    // generate new cylinder using calculated size
    const geometry = new THREE.CylinderGeometry(
      0.001 * size,
      0.001 * size,
      lineType !== 'dotted' ? hypotenuse : hypotenuse / 3,
      2
    )
    // set cylinder color, position, and angle
    const colorArr = rgbStrToArray(color)
    const colorObj = new THREE.Color(
      colorArr[0] / 255,
      colorArr[1] / 255,
      colorArr[2] / 255
    )
    const material = new THREE.MeshBasicMaterial()
    const cylinder = new THREE.Mesh(geometry, material)
    cylinder.material.color.set(colorObj)
    cylinder.position.x = midpoint.x
    cylinder.position.y = midpoint.y
    cylinder.position.z = midpoint.z
    cylinder.rotateY(Math.PI / 2)
    cylinder.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -theta)
    cylinder.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), phi)
    // Add data from feature for highlighting/clicking
    cylinder.userData = {
      cave_name: R.path(['properties', 'cave_name'], feature),
      cave_obj: R.path(['properties', 'cave_obj'], feature),
    }
    return R.append(cylinder, acc)
  }, [])(R.range(0, R.length(points) - 1))
}

// Converts array of geoJson features to array of Meshes to be added to scene
const geoJsonToSegments = (features) =>
  R.pipe(
    R.map((feature) => {
      if (!R.path(['geometry', 'coordinates', 0], feature)) return []

      const arcs = []
      for (let i = 0; i < feature.geometry.coordinates.length - 1; i++) {
        // convert coordinates to MercatorCoordinates on map
        const arcOrigin = MercatorCoordinate.fromLngLat(
          R.path(['geometry', 'coordinates', i], feature),
          R.pathOr(0, ['geometry', 'coordinates', i, 2], feature)
        )
        const arcDestination = MercatorCoordinate.fromLngLat(
          R.path(['geometry', 'coordinates', i + 1], feature),
          R.pathOr(0, ['geometry', 'coordinates', i + 1, 2], feature)
        )

        const distance = Math.sqrt(
          Math.pow(arcOrigin.x - arcDestination.x, 2) +
            Math.pow(arcOrigin.y - arcDestination.y, 2)
        )
        // create a bezier curve with height scaling on distance in range 0.01- 0.06
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(arcOrigin.x, -arcOrigin.y, arcOrigin.z),
          new THREE.Vector3(
            arcOrigin.x,
            -arcOrigin.y,
            arcOrigin.z + distance * 0.05 + 0.01
          ),
          new THREE.Vector3(
            arcDestination.x,
            -arcDestination.y,
            arcDestination.z + distance * 0.05 + 0.01
          ),
          new THREE.Vector3(
            arcDestination.x,
            -arcDestination.y,
            arcDestination.z
          )
        )
        arcs.push(generateSegments(curve, feature))
      }

      return arcs
    }),
    R.flatten
  )(features)

export const ArcLayer3D = memo(({ features, onClick = () => {} }) => {
  const { current: map } = useMap()
  const layer = map.getLayer('3d-model')
  const canvas = map.getCanvas()
  const clickHandler = useRef()
  const hoverHandler = useRef()
  useEffect(() => {
    // Generate meshes from array of geoJson features
    if (layer)
      layer.implementation.updateMeshes(geoJsonToSegments(features || []))
  }, [features, layer])
  useEffect(() => {
    // Update onClick if changed
    if (layer) layer.implementation.onClick = onClick
  }, [onClick, layer])
  // Cleans up event listeners
  useEffect(
    () => () => {
      if (canvas) {
        if (clickHandler.current)
          canvas.removeEventListener('click', clickHandler.current)
        if (hoverHandler.current)
          canvas.removeEventListener('mousemove', hoverHandler.current)
      }
    },
    [canvas]
  )

  // configuration of the custom layer per the CustomLayerInterface
  const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    highlightedId: -1,
    oldColor: -1,
    onClick,
    onAdd: function (map, gl) {
      this.camera = new THREE.PerspectiveCamera()
      this.scene = new THREE.Scene()
      this.map = map
      this.lines = geoJsonToSegments(features || [])
      // add all generated cylinders to scene
      R.forEach((line) => this.scene.add(line))(this.lines)
      // use the Mapbox GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })
      this.renderer.autoClear = false
      this.raycaster = new THREE.Raycaster()
      this.raycaster.near = -1
      this.raycaster.far = 1e6

      clickHandler.current = (e) => this.raycast(e, true)
      hoverHandler.current = (e) => this.raycast(e, false)
      map.getCanvas().addEventListener('mousemove', hoverHandler.current, false)
      map.getCanvas().addEventListener('click', clickHandler.current, false)
      map.moveLayer('3d-model')
    },
    onRemove: function () {
      this.map
        .getCanvas()
        .removeEventListener('mousemove', hoverHandler.current)
      this.map.getCanvas().removeEventListener('click', clickHandler.current)
    },
    updateMeshes: function (currentMeshes) {
      this.scene.remove.apply(this.scene, this.scene.children)
      R.forEach((line) => this.scene.add(line))(currentMeshes)
      this.lines = currentMeshes
    },
    raycast: (e, click) => {
      const layer =
        map.getLayer('3d-model') && map.getLayer('3d-model').implementation
      if (layer) {
        const point = { x: e.layerX, y: e.layerY }
        const mouse = new THREE.Vector2()
        // // scale mouse pixel position to a percentage of the screen's width and height
        mouse.x = (point.x / e.srcElement.width) * 2 - 1
        mouse.y = 1 - (point.y / e.srcElement.height) * 2
        const camInverseProjection = new THREE.Matrix4()
          .copy(layer.camera.projectionMatrix)
          .invert()
        const cameraPosition = new THREE.Vector3().applyMatrix4(
          camInverseProjection
        )
        const mousePosition = new THREE.Vector3(
          mouse.x,
          mouse.y,
          1
        ).applyMatrix4(camInverseProjection)
        const viewDirection = mousePosition
          .clone()
          .sub(cameraPosition)
          .normalize()

        layer.raycaster.set(cameraPosition, viewDirection)

        // calculate objects intersecting the picking ray
        const intersects = layer.raycaster.intersectObjects(layer.lines, true)
        if (intersects.length) {
          // Prevent layers under this one from being clicked/highlighted
          e.stopImmediatePropagation()
          // Remove current layer highlights
          const event = new CustomEvent('clearHighlight')
          document.dispatchEvent(event)
          if (click) layer.onClick(intersects[0].object.userData)
        }
        // handle hovering
        if (!click) {
          if (intersects.length) {
            if (
              layer.highlightedId !== intersects[0].object.userData.cave_name
            ) {
              if (layer.highlightedId !== -1) {
                R.forEach((line) => {
                  if (line.userData.cave_name === layer.highlightedId)
                    line.material.color.set(layer.oldColor)
                })(layer.lines)
              }
              map.getCanvas().style.cursor = 'pointer'
              layer.highlightedId = intersects[0].object.userData.cave_name
              layer.oldColor = intersects[0].object.material.color.clone()
              const colorArr = rgbStrToArray(HIGHLIGHT_COLOR)
              const colorObj = new THREE.Color(
                colorArr[0] / 255,
                colorArr[1] / 255,
                colorArr[2] / 255
              )
              R.forEach((line) => {
                if (line.userData.cave_name === layer.highlightedId)
                  line.material.color.set(colorObj)
              })(layer.lines)
            }
          } else if (layer.highlightedId !== -1) {
            R.forEach((line) => {
              if (line.userData.cave_name === layer.highlightedId)
                line.material.color.set(layer.oldColor)
            })(layer.lines)
            layer.highlightedId = -1
          }
        }
      }
    },
    render: function (gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix)
      // Note: Y must be inverted, otherwise weird y rendering results
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform._zoom
      const scale = 1 / Math.pow(2, zoom)
      // Note: Scaling isn't perfect due to perspective changes
      R.forEach((line) => line.scale.set(1, 1, scale))(this.lines)
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }
  return <Layer {...customLayer} />
})

export const NodesWithZ = memo(({ id, nodes, onClick = () => {} }) => {
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [nodesMemo, setNodesMemo] = useState(nodes)
  const [iconData, setIconData] = useState({})

  // Converts geoJson nodes into Three.js nodes with altitude
  const createNodesObjects = useCallback(
    (nodes) =>
      R.map((node) => {
        const nodeXYZ = MercatorCoordinate.fromLngLat(
          [
            R.path(['geometry', 'coordinates', 0], node),
            R.path(['geometry', 'coordinates', 1], node),
          ],
          R.pathOr(100000, ['geometry', 'coordinates', 2], node)
        )

        const iconSrc = iconData[R.path(['properties', 'icon'], node)]
        const texture = new THREE.TextureLoader().load(iconSrc, (texture) => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = ICON_RESOLUTION
          canvas.height = ICON_RESOLUTION
          context.drawImage(
            texture.image,
            0,
            0,
            ICON_RESOLUTION,
            ICON_RESOLUTION
          )
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          )
          const data = imageData.data

          const rgbaColor = rgbStrToArray(
            R.pathOr('rgba(0,0,0,255)', ['properties', 'color'], node)
          )
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] !== 0) {
              data[i] = rgbaColor[0]
              data[i + 1] = rgbaColor[1]
              data[i + 2] = rgbaColor[2]
            }
          }

          context.putImageData(imageData, 0, 0)
          texture.image = canvas
          texture.needsUpdate = true
        })

        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
        })
        const nodeWithAltitude = new THREE.Sprite(spriteMaterial)
        nodeWithAltitude.position.set(nodeXYZ.x, -nodeXYZ.y, nodeXYZ.z)
        nodeWithAltitude.userData = {
          cave_name: R.path(['properties', 'cave_name'], node),
          cave_obj: R.path(['properties', 'cave_obj'], node),
          size: R.pathOr(1, ['properties', 'size'], node),
        }
        return nodeWithAltitude
      })(nodes),
    [iconData]
  )

  useEffect(() => {
    if (!R.equals(nodes, nodesMemo)) setNodesMemo(nodes)
  }, [nodes, nodesMemo])

  useEffect(() => {
    const iconsToLoad = [
      ...new Set(nodesMemo.map((node) => R.path(['properties', 'icon'], node))),
    ]
    R.forEach(async (iconName) => {
      const iconComponent =
        iconName === 'MdDownloading' ? (
          <MdDownloading />
        ) : (
          (await fetchIcon(iconName, iconUrl))()
        )
      const svgString = renderToStaticMarkup(iconComponent)
      const iconSrc = `data:image/svg+xml;base64,${window.btoa(svgString)}`
      if (!iconData[iconName])
        setIconData((iconStrings) => R.assoc(iconName, iconSrc)(iconStrings))
    })(iconsToLoad)
  }, [nodesMemo, iconUrl, iconData])

  return (
    <CustomLayer
      id={id}
      convertFeaturesToObjects={createNodesObjects}
      features={nodesMemo}
      onClick={onClick}
      getScale={(node, zoom) => {
        const scale = 0.1 / Math.pow(2, zoom)
        return [node.userData.size * scale, node.userData.size * scale, 1]
      }}
    />
  )
})

export const GeosWithZ = memo(({ id, geos, onClick = () => {} }) => {
  const [geosMemo, setGeosMemo] = useState(geos)

  // Converts geoJson geos into Three.js geos with altitude
  const createGeosObjects = (geos) =>
    R.pipe(
      R.map((geo) => {
        if (!R.path(['geometry', 'coordinates', 0], geo)) return []

        const geoType = R.path(['geometry', 'type'], geo)
        const polygons =
          geoType === 'Polygon'
            ? [R.path(['geometry', 'coordinates'], geo)]
            : R.path(['geometry', 'coordinates'], geo)

        return R.map((polygon) => {
          // TODOB: POLYGON[0] IS OUTER RING AND OTHER INDICES ARE HOLES SO
          // MAKE SURE TO HANDLE HOLES
          const vertices = R.pipe(
            R.map((point) => {
              const pointXYZ = MercatorCoordinate.fromLngLat(
                [R.path([0], point), R.path([1], point)],
                R.pathOr(100000, [2], point)
              )

              return [pointXYZ.x, -pointXYZ.y, pointXYZ.z]
            }),
            R.flatten
          )(R.slice(0, -1, polygon[0]))

          const triangles = earcut(vertices, null, 3)
          const geometry = new THREE.BufferGeometry()
          const verticesFloat32Array = new Float32Array(vertices)
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(verticesFloat32Array, 3)
          )
          geometry.setIndex(triangles)
          const material = new THREE.MeshBasicMaterial({
            color: R.pathOr('rgba(0,0,0,255)', ['properties', 'color'], geo),
            side: THREE.DoubleSide,
          })
          const polygonObject = new THREE.Mesh(geometry, material)
          polygonObject.userData = {
            cave_name: R.path(['properties', 'cave_name'], geo),
            cave_obj: R.path(['properties', 'cave_obj'], geo),
          }

          return polygonObject
        })(polygons)
      }),
      R.flatten
    )(geos)

  useEffect(() => {
    if (!R.equals(geos, geosMemo)) setGeosMemo(geos)
  }, [geos, geosMemo])

  return (
    <CustomLayer
      id={id}
      convertFeaturesToObjects={createGeosObjects}
      features={geosMemo}
      onClick={onClick}
      getScale={() => [1, 1, 1]}
    />
  )
})

export const ArcsWithZ = memo(({ id, geos: arcs, onClick = () => {} }) => {
  const [arcsMemo, setArcsMemo] = useState(arcs)

  const convertArcs = (arcs) =>
    R.map((arc) => {
      if (!R.path(['geometry', 'coordinates', 0], arc)) return arc

      const size = R.pathOr(10, ['properties', 'size'], arc)
      const resizedGeos = R.assocPath(['properties', 'size'], size * 0.02, arc)
      return R.assocPath(
        ['geometry', 'coordinates'],
        R.map((point) =>
          R.path([2], point) ? point : R.assocPath([2], 100000, point)
        )(R.path(['geometry', 'coordinates'], resizedGeos)),
        resizedGeos
      )
    })(arcs)

  useEffect(() => {
    if (!R.equals(arcs, arcsMemo)) setArcsMemo(arcs)
  }, [arcs, arcsMemo])

  return (
    <CustomLayer
      id={id}
      convertFeaturesToObjects={geoJsonToSegments}
      features={convertArcs(arcsMemo)}
      onClick={onClick}
      getScale={() => [1, 1, 1]}
    />
  )
})

const CustomLayer = memo(
  ({
    id,
    convertFeaturesToObjects,
    features,
    onClick = () => {},
    getScale,
  }) => {
    const { current: map } = useMap()
    const layer = map.getLayer(id)
    const canvas = map.getCanvas()

    const clickHandler = useRef()
    const hoverHandler = useRef()

    useEffect(() => {
      if (layer)
        layer.implementation.updateObjects(convertFeaturesToObjects(features))
    }, [features, layer, convertFeaturesToObjects])

    useEffect(() => {
      if (layer) layer.implementation.onClick = onClick
    }, [onClick, layer])

    useEffect(
      () => () => {
        if (canvas) {
          if (clickHandler.current)
            canvas.removeEventListener('click', clickHandler.current)
          if (hoverHandler.current)
            canvas.removeEventListener('mousemove', hoverHandler.current)
        }
      },
      [canvas]
    )

    const customLayer = {
      id,
      type: 'custom',
      highlightedId: -1,
      oldColor: -1,
      onClick,
      onAdd: function (map, gl) {
        this.camera = new THREE.PerspectiveCamera()
        this.scene = new THREE.Scene()
        this.map = map
        this.objects = convertFeaturesToObjects(features)
        R.forEach((object) => this.scene.add(object))(this.objects)
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        })
        this.renderer.autoClear = false
        this.raycaster = new THREE.Raycaster()
        this.raycaster.near = -1
        this.raycaster.far = 1e6

        clickHandler.current = (e) => this.raycast(e, true)
        hoverHandler.current = (e) => this.raycast(e, false)
        map
          .getCanvas()
          .addEventListener('mousemove', hoverHandler.current, false)
        map.getCanvas().addEventListener('click', clickHandler.current, false)
        map.moveLayer(id)
      },
      onRemove: function () {
        this.map
          .getCanvas()
          .removeEventListener('mousemove', hoverHandler.current)
        this.map.getCanvas().removeEventListener('click', clickHandler.current)
      },
      updateObjects: function (newObjects) {
        this.scene.remove.apply(this.scene, this.scene.children)
        R.forEach((object) => this.scene.add(object))(newObjects)
        this.objects = newObjects
      },
      raycast: (e, click) => {
        const layer = map.getLayer(id) && map.getLayer(id).implementation
        if (layer) {
          const point = { x: e.layerX, y: e.layerY }
          const mouse = new THREE.Vector2()
          mouse.x = (point.x / e.srcElement.width) * 2 - 1
          mouse.y = 1 - (point.y / e.srcElement.height) * 2
          const camInverseProjection = new THREE.Matrix4()
            .copy(layer.camera.projectionMatrix)
            .invert()
          const cameraPosition = new THREE.Vector3().applyMatrix4(
            camInverseProjection
          )
          const mousePosition = new THREE.Vector3(
            mouse.x,
            mouse.y,
            1
          ).applyMatrix4(camInverseProjection)
          const viewDirection = mousePosition
            .clone()
            .sub(cameraPosition)
            .normalize()

          layer.raycaster.camera = layer.camera
          layer.raycaster.set(cameraPosition, viewDirection)

          const intersects = layer.raycaster.intersectObjects(
            layer.objects,
            true
          )
          if (intersects.length) {
            e.stopImmediatePropagation()
            const event = new CustomEvent('clearHighlight')
            document.dispatchEvent(event)
            if (click) layer.onClick(intersects[0].object.userData)
          }

          if (!click) {
            if (intersects.length) {
              if (
                layer.highlightedId !== intersects[0].object.userData.cave_name
              ) {
                if (layer.highlightedId !== -1) {
                  R.forEach((object) => {
                    if (object.userData.cave_name === layer.highlightedId)
                      object.material.color.set(layer.oldColor)
                  })(layer.objects)
                }
                map.getCanvas().style.cursor = 'pointer'
                layer.highlightedId = intersects[0].object.userData.cave_name
                layer.oldColor = intersects[0].object.material.color.clone()
                const colorArr = rgbStrToArray(HIGHLIGHT_COLOR)
                const colorObj = new THREE.Color(
                  colorArr[0] / 255,
                  colorArr[1] / 255,
                  colorArr[2] / 255
                )
                R.forEach((object) => {
                  if (object.userData.cave_name === layer.highlightedId)
                    object.material.color.set(colorObj)
                })(layer.objects)
              }
            } else if (layer.highlightedId !== -1) {
              R.forEach((object) => {
                if (object.userData.cave_name === layer.highlightedId)
                  object.material.color.set(layer.oldColor)
              })(layer.objects)
              layer.highlightedId = -1
            }
          }
        }
      },
      render: function (gl, matrix) {
        const m = new THREE.Matrix4().fromArray(matrix)
        const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
        const zoom = this.map.transform._zoom
        R.forEach((object) => object.scale.set(...getScale(object, zoom)))(
          this.objects
        )
        this.camera.projectionMatrix = m.multiply(l)
        this.renderer.resetState()
        this.renderer.render(this.scene, this.camera)
        this.map.triggerRepaint()
      },
    }

    return <Layer {...customLayer} />
  }
)
