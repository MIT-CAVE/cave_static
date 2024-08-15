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

const MAX_HEIGHT = 0.00325
// Generate line segment
const generateSegment = (curve, feature, segments = 80) => {
  const lineType = R.pathOr('solid', ['properties', 'dash'], feature)
  const color = R.pathOr('rgba(0,0,0,255)', ['properties', 'color'], feature)
  const size = R.pathOr(30, ['properties', 'size'], feature)

  const points = curve.getPoints(segments)
  const lineSegmentRects = []
  R.forEach(
    (idx) => {
      // Skip every other segment for dashed line
      if (lineType === 'dashed' && idx % 2 === 0) return

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

      const geometry = new THREE.BoxGeometry(
        0.00003 * size, // width
        lineType === 'dotted' ? hypotenuse / 3 : hypotenuse, // length
        0 // thickness
      )
      // set cylinder color, position, and angle
      const colorArr = rgbStrToArray(color)
      const colorObj = new THREE.Color(
        colorArr[0] / 255,
        colorArr[1] / 255,
        colorArr[2] / 255
      )
      const material = new THREE.MeshBasicMaterial()
      const rect = new THREE.Mesh(geometry, material)
      rect.material.color.set(colorObj)
      rect.position.set(midpoint.x, midpoint.y, midpoint.z)
      rect.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -theta)
      rect.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), phi)

      lineSegmentRects.push(rect)
    },
    R.range(0, R.length(points) - 1)
  )

  return lineSegmentRects
}

// Converts array of geoJson features to array of Meshes to be added to scene
const geoJsonToSegments = (features, layerId) => {
  const allArcs = []

  R.forEach((feature) => {
    if (!R.path(['geometry', 'coordinates', 0], feature)) return

    const height = R.pathOr(100, ['properties', 'height'], feature) / 100
    const arcs = []
    for (let i = 0; i < feature.geometry.coordinates.length - 1; i++) {
      // convert coordinates to MercatorCoordinates on map
      const arcOrigin = MercatorCoordinate.fromLngLat(
        R.path(['geometry', 'coordinates', i], feature),
        0
      )
      arcOrigin.z =
        R.pathOr(0, ['geometry', 'coordinates', i, 2], feature) * MAX_HEIGHT
      const arcDestination = MercatorCoordinate.fromLngLat(
        R.path(['geometry', 'coordinates', i + 1], feature),
        0
      )
      arcDestination.z =
        R.pathOr(0, ['geometry', 'coordinates', i + 1, 2], feature) * MAX_HEIGHT

      // create a bezier curve with height scaling with heightBy
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(arcOrigin.x, -arcOrigin.y, arcOrigin.z),
        new THREE.Vector3(
          arcOrigin.x,
          -arcOrigin.y,
          arcOrigin.z + height * 0.015
        ),
        new THREE.Vector3(
          arcDestination.x,
          -arcDestination.y,
          arcDestination.z + height * 0.015
        ),
        new THREE.Vector3(arcDestination.x, -arcDestination.y, arcDestination.z)
      )
      arcs.push(generateSegment(curve, feature))
    }

    const arcGroup = new THREE.Group()
    R.forEach((arc) => R.forEach((rect) => arcGroup.add(rect), arc), arcs)
    // Add data from feature for highlighting/clicking
    arcGroup.userData = {
      cave_name: R.path(['properties', 'cave_name'], feature),
      cave_obj: R.path(['properties', 'cave_obj'], feature),
      layerId,
    }

    allArcs.push(arcGroup)
  }, features)

  return allArcs
}

export const ArcLayer3D = memo(({ features, onClick = () => {} }) => {
  const { current: map } = useMap()
  const layer = map.getLayer('3d-model')
  const canvas = map.getCanvas()

  const clickHandler = useRef()
  const hoverHandler = useRef()

  const id = '3d-model'

  useEffect(() => {
    // Generate meshes from array of geoJson features
    if (layer)
      layer.implementation.updateMeshes(geoJsonToSegments(features || [], id))
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
    id,
    type: 'custom',
    renderingMode: '3d',
    highlightedId: -1,
    oldColor: -1,
    onClick,
    onAdd: function (map, gl) {
      this.camera = new THREE.PerspectiveCamera()
      this.scene = new THREE.Scene()
      this.map = map
      this.lines = geoJsonToSegments(features || [], id)
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

export const NodesWithHeight = memo(({ id, nodes, onClick = () => {} }) => {
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [nodesMemo, setNodesMemo] = useState(nodes)
  const [iconData, setIconData] = useState({})

  // Converts geoJson nodes into Three.js nodes with height
  const createNodesObjects = useCallback(
    (nodes) =>
      R.map((node) => {
        const nodeXYZ = MercatorCoordinate.fromLngLat(
          [
            R.path(['geometry', 'coordinates', 0], node),
            R.path(['geometry', 'coordinates', 1], node),
          ],
          0
        )
        nodeXYZ.z =
          R.pathOr(0, ['geometry', 'coordinates', 2], node) * MAX_HEIGHT

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
        const nodeWithHeight = new THREE.Sprite(spriteMaterial)
        nodeWithHeight.position.set(nodeXYZ.x, -nodeXYZ.y, nodeXYZ.z)
        nodeWithHeight.userData = {
          cave_name: R.path(['properties', 'cave_name'], node),
          cave_obj: R.path(['properties', 'cave_obj'], node),
          size: R.pathOr(1, ['properties', 'size'], node),
          layerId: id,
        }
        return nodeWithHeight
      }, nodes),
    [iconData, id]
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

export const GeosWithHeight = memo(({ id, geos, onClick = () => {} }) => {
  const [geosMemo, setGeosMemo] = useState(geos)

  // Converts geoJson geos into Three.js geos with height
  const createGeosObjects = (geos) => {
    const geoGroups = []

    R.forEach((geo) => {
      if (!R.path(['geometry', 'coordinates', 0], geo)) return

      const geoType = R.path(['geometry', 'type'], geo)
      const polygons =
        geoType === 'Polygon'
          ? [R.path(['geometry', 'coordinates'], geo)]
          : R.path(['geometry', 'coordinates'], geo)
      const height =
        (MAX_HEIGHT * R.pathOr(0, ['properties', 'height'], geo)) / 100

      const geoGroup = new THREE.Group()
      geoGroup.userData = {
        cave_name: R.path(['properties', 'cave_name'], geo),
        cave_obj: R.path(['properties', 'cave_obj'], geo),
        layerId: id,
      }

      R.forEach((polygon) => {
        // Outer Ring
        const outerRing = []

        R.forEach(
          (point) => {
            const pointXYZ = MercatorCoordinate.fromLngLat(
              [R.path([0], point), R.path([1], point)],
              0
            )
            outerRing.push(pointXYZ.x, -pointXYZ.y, height)
          },
          R.slice(0, -1, polygon[0])
        )

        // Holes
        const holes = R.map(
          (hole) => {
            const holeVertices = []

            R.forEach(
              (point) => {
                const pointXYZ = MercatorCoordinate.fromLngLat(
                  [R.path([0], point), R.path([1], point)],
                  0
                )
                holeVertices.push(pointXYZ.x, -pointXYZ.y, height)
              },
              R.slice(0, -1, hole)
            )

            return holeVertices
          },
          R.slice(1, polygon.length, polygon)
        )
        const allVertices = [...outerRing, ...R.unnest(holes)]

        const holeIndices = []
        let holeOffset = outerRing.length / 3 // Each vertex has 3 components (x, y, z)
        R.forEach((hole) => {
          holeIndices.push(holeOffset)
          holeOffset += hole.length / 3
        }, holes)

        // Create the side faces
        const sideVertices = []
        const sideTriangles = []
        let vertexOffset = 0

        // Function to create side faces for a ring (outer or hole)
        const createSideFaces = (ring) => {
          const numPoints = ring.length / 3
          for (let i = 0; i < numPoints; i++) {
            const x = ring[i * 3]
            const y = ring[i * 3 + 1]
            const z = ring[i * 3 + 2]

            // Top vertex
            sideVertices.push(x, y, z)
            // Corresponding bottom vertex (z = 0)
            sideVertices.push(x, y, 0)
          }

          for (let i = 0; i < numPoints - 1; i++) {
            sideTriangles.push(
              vertexOffset + i * 2,
              vertexOffset + i * 2 + 1,
              vertexOffset + i * 2 + 2,
              vertexOffset + i * 2 + 1,
              vertexOffset + i * 2 + 3,
              vertexOffset + i * 2 + 2
            )
          }
          // Close the last face
          sideTriangles.push(
            vertexOffset + (numPoints - 1) * 2,
            vertexOffset + (numPoints - 1) * 2 + 1,
            vertexOffset,
            vertexOffset + (numPoints - 1) * 2 + 1,
            vertexOffset + 1,
            vertexOffset
          )

          vertexOffset += numPoints * 2
        }

        // Generate side faces for the outer ring
        createSideFaces(outerRing)

        // Generate side faces for each hole
        holes.forEach(createSideFaces)

        const color = R.pathOr(
          'rgba(0, 0, 0, 255)',
          ['properties', 'color'],
          geo
        )

        const sideGeometry = new THREE.BufferGeometry()
        const sideVerticesFloat32Array = new Float32Array(sideVertices)
        sideGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(sideVerticesFloat32Array, 3)
        )
        sideGeometry.setIndex(sideTriangles)

        const sideMaterial = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: parseInt(rgbStrToArray(color)[3]) * 0.2,
        })

        const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial)

        // Create the top face
        const topTriangles = earcut(allVertices, holeIndices, 3)
        const topGeometry = new THREE.BufferGeometry()
        const verticesFloat32Array = new Float32Array(allVertices)
        topGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(verticesFloat32Array, 3)
        )
        topGeometry.setIndex(topTriangles)

        const topMaterial = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: parseInt(rgbStrToArray(color)[3]) * 0.4,
        })

        const topMesh = new THREE.Mesh(topGeometry, topMaterial)

        geoGroup.add(topMesh, sideMesh)
      }, polygons)

      geoGroups.push(geoGroup)
    }, geos)

    return geoGroups
  }

  useEffect(() => {
    if (!R.equals(geos, geosMemo)) setGeosMemo(geos)
  }, [geos, geosMemo])

  return (
    <CustomLayer
      id={id}
      convertFeaturesToObjects={createGeosObjects}
      features={geosMemo}
      onClick={onClick}
    />
  )
})

export const ArcsWithHeight = memo(({ id, arcs, onClick = () => {} }) => {
  const [arcsMemo, setArcsMemo] = useState(arcs)

  useEffect(() => {
    if (!R.equals(arcs, arcsMemo)) setArcsMemo(arcs)
  }, [arcs, arcsMemo])

  return (
    <CustomLayer
      id={id}
      convertFeaturesToObjects={geoJsonToSegments}
      features={arcsMemo}
      onClick={onClick}
      getScale={(arc, zoom) => [50 / Math.pow(2, zoom), 1, 1]}
    />
  )
})

// All custom layers use the same scene and renderer
const scene = new THREE.Scene()
let renderer = null
const raycaster = new THREE.Raycaster()
raycaster.near = -1
raycaster.far = 1e6
let highlightedObject = null
let oldColor = null

const CustomLayer = memo(
  ({
    id,
    convertFeaturesToObjects,
    features,
    onClick = () => {},
    getScale = () => [1, 1, 1],
  }) => {
    const { current: map } = useMap()
    const layer = map.getLayer(id)
    const canvas = map.getCanvas()

    const clickHandler = useRef()
    const hoverHandler = useRef()
    const prevObjects = useRef()

    const createDuplicates = (objects) => {
      const duplicates = []

      R.forEach((object) => {
        const leftDuplicate = object.clone()
        leftDuplicate.position.x -= 1

        const rightDuplicate = object.clone()
        rightDuplicate.position.x += 1

        duplicates.push(leftDuplicate, rightDuplicate)
      }, objects)

      return duplicates
    }

    const getObjectContainer = (object) =>
      R.isEmpty(object.userData) ? getObjectContainer(object.parent) : object

    const setObjectColor = (object, color) => {
      const container = getObjectContainer(object)

      const setChildrenColor = (object, color) => {
        if (object.isGroup)
          R.forEach((child) => setChildrenColor(child, color), object.children)
        else object.material.color.set(color)
      }

      setChildrenColor(container, color)
    }

    const clearHighlight = () => {
      if (R.isNotNil(highlightedObject))
        setObjectColor(highlightedObject, oldColor)
    }

    const setZoom = (object, zoom) => {
      if (object.isGroup)
        R.forEach((child) => {
          setZoom(child, zoom)
        }, object.children)
      else object.scale.set(...getScale(object, zoom))
    }

    useEffect(() => {
      if (layer)
        layer.implementation.updateObjects(
          convertFeaturesToObjects(features, id)
        )
    }, [features, id, layer, convertFeaturesToObjects])

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
      onClick,
      onAdd: function (map, gl) {
        // onAdd is called twice without onRemove in between for some reason
        if (prevObjects.current) scene.remove(prevObjects.current)

        this.camera = new THREE.PerspectiveCamera()
        this.map = map
        const objects = convertFeaturesToObjects(features, id)
        this.objects = new THREE.Group()
        R.forEach(
          (object) => this.objects.add(object),
          R.concat(objects, createDuplicates(objects))
        )
        prevObjects.current = this.objects
        scene.add(this.objects)

        if (R.isNil(renderer)) {
          renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          })
          renderer.autoClear = false
        }

        this.raycaster = raycaster

        clickHandler.current = (e) => this.raycast(e, true)
        hoverHandler.current = (e) => this.raycast(e, false)
        map
          .getCanvas()
          .addEventListener('mousemove', hoverHandler.current, false)
        map.getCanvas().addEventListener('click', clickHandler.current, false)

        // Move layer behind first symbol layer
        for (const mapLayer of map.getStyle().layers) {
          if (mapLayer.type === 'symbol') {
            map.moveLayer(id, mapLayer.id)
            break
          }
        }
      },
      onRemove: function () {
        this.map
          .getCanvas()
          .removeEventListener('mousemove', hoverHandler.current)
        this.map.getCanvas().removeEventListener('click', clickHandler.current)
        scene.remove(this.objects)
      },
      updateObjects: function (newObjects) {
        scene.remove(this.objects)
        const allObjects = R.concat(newObjects, createDuplicates(newObjects))
        const objects = new THREE.Group()
        R.forEach((object) => objects.add(object), allObjects)
        scene.add(objects)
        this.objects = objects
      },
      raycast: (e, click) => {
        const layer = map.getLayer(id) && map.getLayer(id).implementation
        if (!layer) return

        const dpr = window.devicePixelRatio || 1
        const point = { x: e.layerX * dpr, y: e.layerY * dpr }
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
          scene.children,
          true
        )
        const hovering = intersects.length !== 0
        const wasPreviousHighlight = R.isNotNil(highlightedObject)

        if (hovering) {
          const hoveredObject = R.path([0, 'object'], intersects)
          const hoveredUserData = R.prop(
            'userData',
            getObjectContainer(hoveredObject)
          )

          if (hoveredUserData.layerId !== id) return

          // Prevent other layers from being clicked/highlighted
          e.stopImmediatePropagation()
          // Clear highlight from non-custom layers
          const event = new CustomEvent('clearHighlight')
          document.dispatchEvent(event)

          if (click) {
            layer.onClick(hoveredUserData)
          } else if (
            // if hovering over new object
            highlightedObject !== hoveredObject
          ) {
            clearHighlight()
            map.getCanvas().style.cursor = 'pointer'
            highlightedObject = hoveredObject
            oldColor = highlightedObject.material.color.clone()
            const colorArr = rgbStrToArray(HIGHLIGHT_COLOR)
            const colorObj = new THREE.Color(
              colorArr[0] / 255,
              colorArr[1] / 255,
              colorArr[2] / 255
            )
            setObjectColor(hoveredObject, colorObj)
          }
        } else if (wasPreviousHighlight && !click) {
          clearHighlight()
          highlightedObject = null
        }
      },
      render: function (gl, matrix) {
        const m = new THREE.Matrix4().fromArray(matrix)
        const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
        const zoom = this.map.transform._zoom
        setZoom(this.objects, zoom)
        this.camera.projectionMatrix = m.multiply(l)
        renderer.resetState()
        renderer.render(scene, this.camera)
        this.map.triggerRepaint()
      },
    }

    return <Layer {...customLayer} />
  }
)
