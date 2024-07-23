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
      Math.atan(
        (points[idx].y - points[idx + 1].y) /
          (points[idx].x - points[idx + 1].x)
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
      // Coordinates must go from less -> greater long for theta calc
      const flipped =
        feature.geometry.coordinates[0][0] < feature.geometry.coordinates[1][0]
      // convert coordinates to MercatorCoordinates on map
      const arcOrigin = MercatorCoordinate.fromLngLat(
        feature.geometry.coordinates[flipped ? 1 : 0],
        0
      )
      const arcDestination = MercatorCoordinate.fromLngLat(
        feature.geometry.coordinates[flipped ? 0 : 1],
        0
      )
      const distance = Math.sqrt(
        Math.pow(arcOrigin.x - arcDestination.x, 2) +
          Math.pow(arcOrigin.y - arcDestination.y, 2)
      )
      // create a bezier curve with height scaling on distance in range 0.01- 0.06
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(arcOrigin.x, -arcOrigin.y, 0),
        new THREE.Vector3(arcOrigin.x, -arcOrigin.y, distance * 0.05 + 0.01),
        new THREE.Vector3(
          arcDestination.x,
          -arcDestination.y,
          distance * 0.05 + 0.01
        ),
        new THREE.Vector3(arcDestination.x, -arcDestination.y, 0)
      )
      return generateSegments(curve, feature)
    }),
    R.unnest
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

export const NodesWithZ = memo(({ nodes, onClick = () => {} }) => {
  const { current: map } = useMap()
  const layer = map.getLayer('nodes-with-altitude')
  const canvas = map.getCanvas()

  const iconUrl = useSelector(selectSettingsIconUrl)
  const [nodeMemo, setNodeMemo] = useState(nodes)
  const [iconData, setIconData] = useState({})

  const clickHandler = useRef()
  const hoverHandler = useRef()

  // Converts geoJson nodes into Three.js nodes with altitude
  const createNodes = useCallback(
    (nodes) => {
      return nodes.map((node) => {
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
        }
        console.log(nodeWithAltitude)
        return nodeWithAltitude
      })
    },
    [iconData]
  )

  useEffect(() => {
    if (!R.equals(nodes, nodeMemo)) setNodeMemo(nodes)
  }, [nodes, nodeMemo])

  useEffect(() => {
    if (layer) {
      const iconsToLoad = [
        ...new Set(
          nodeMemo.map((node) => R.path(['properties', 'icon'], node))
        ),
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

      layer.implementation.updateNodes(createNodes(nodeMemo))
    }
  }, [nodeMemo, layer, iconUrl, iconData, createNodes])

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
    id: 'nodes-with-altitude',
    type: 'custom',
    highlightedId: -1,
    oldColor: -1,
    onClick,
    onAdd: function (map, gl) {
      this.camera = new THREE.PerspectiveCamera()
      this.scene = new THREE.Scene()
      this.map = map
      this.nodes = createNodes(nodes)
      this.nodes.forEach((node) => this.scene.add(node))
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
      map.moveLayer('nodes-with-altitude')
    },
    onRemove: function () {
      this.map
        .getCanvas()
        .removeEventListener('mousemove', hoverHandler.current)
      this.map.getCanvas().removeEventListener('click', clickHandler.current)
    },
    raycast: (e, click) => {
      const layer =
        map.getLayer('nodes-with-altitude') &&
        map.getLayer('nodes-with-altitude').implementation
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

        const intersects = layer.raycaster.intersectObjects(layer.nodes, true)
        if (intersects && intersects.length) {
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
                R.forEach((nodes) => {
                  if (nodes.userData.cave_name === layer.highlightedId)
                    nodes.material.color.set(layer.oldColor)
                })(layer.nodes)
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
              R.forEach((nodes) => {
                if (nodes.userData.cave_name === layer.highlightedId)
                  nodes.material.color.set(colorObj)
              })(layer.nodes)
            }
          } else if (layer.highlightedId !== -1) {
            R.forEach((nodes) => {
              if (nodes.userData.cave_name === layer.highlightedId)
                nodes.material.color.set(layer.oldColor)
            })(layer.nodes)
            layer.highlightedId = -1
          }
        }
      }
    },
    updateNodes: function (newNodes) {
      this.scene.remove.apply(this.scene, this.scene.children)
      this.nodes = newNodes
      this.nodes.forEach((node) => this.scene.add(node))
    },
    render: function (gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix)
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform._zoom
      const scale = 0.1 / Math.pow(2, zoom)
      this.nodes.forEach((node) => node.scale.set(scale, scale, 1))
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }

  return <Layer {...customLayer} />
})
