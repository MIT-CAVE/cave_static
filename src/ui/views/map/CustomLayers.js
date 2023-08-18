import { MercatorCoordinate } from 'maplibre-gl'
import * as R from 'ramda'
import { memo, useEffect, useState } from 'react'
import { Layer } from 'react-map-gl'
import * as THREE from 'three'

// Generate custom cylinder segments to allow for constant pixel sizing
const generateSegments = (curve, lineType = 'solid', segments = 80) => {
  const points = curve.getPoints(segments)
  return R.reduce((acc, idx) => {
    // Skip every other segment for dashed line
    if (lineType === 'dashed' && idx % 2 === 0) return acc
    const midpoint = new THREE.Vector3(
      (points[idx].x + points[idx + 1].x) / 2,
      (points[idx].y + points[idx + 1].y) / 2,
      (points[idx].z + points[idx + 1].z) / 2
    )
    const hypotenuse = Math.sqrt(
      Math.pow(points[idx].x - points[idx + 1].x, 2) +
        Math.pow(points[idx].y - points[idx + 1].y, 2) +
        Math.pow(points[idx].z - points[idx + 1].z, 2)
    )
    const theta = Math.asin((points[idx].z - points[idx + 1].z) / hypotenuse)
    const phi =
      Math.atan(
        (points[idx].y - points[idx + 1].y) /
          (points[idx].x - points[idx + 1].x)
      ) +
      Math.PI / 2
    const geometry = new THREE.CylinderGeometry(
      0.01,
      0.01,
      lineType === 'solid' ? hypotenuse : hypotenuse / 3,
      2
    )
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    })
    const cylinder = new THREE.Mesh(geometry, material)
    cylinder.position.x = midpoint.x
    cylinder.position.y = midpoint.y
    cylinder.position.z = midpoint.z
    cylinder.rotateY(Math.PI / 2)
    cylinder.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -theta)
    cylinder.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), phi)
    return R.append(cylinder, acc)
  }, [])(R.range(0, R.length(points) - 1))
}

const geoJsonToSegments = (features) =>
  R.pipe(
    R.map((feature) => {
      const arcOrigin = MercatorCoordinate.fromLngLat(
        feature.geometry.coordinates[0],
        0
      )
      const arcDestination = MercatorCoordinate.fromLngLat(
        feature.geometry.coordinates[1],
        0
      )
      const distance = Math.sqrt(
        Math.pow(arcOrigin.x - arcDestination.x, 2) +
          Math.pow(arcOrigin.y - arcDestination.y, 2)
      )
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(arcOrigin.x, -arcOrigin.y, 0),
        new THREE.Vector3(arcOrigin.x, -arcOrigin.y, distance),
        new THREE.Vector3(arcDestination.x, -arcDestination.y, distance),
        new THREE.Vector3(arcDestination.x, -arcDestination.y, 0)
      )
      return generateSegments(curve, feature.properties.dash)
    }),
    R.unnest
  )(features)

export const ArcLayer3D = memo(({ features }) => {
  const [lines, setLines] = useState([])
  // Generate meshes from points
  useEffect(() => {
    setLines(geoJsonToSegments(features || []))
  }, [features])
  // configuration of the custom layer per the CustomLayerInterface
  let clickHandler
  const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, gl) {
      this.camera = new THREE.PerspectiveCamera()
      this.scene = new THREE.Scene()
      // create two three.js lights to illuminate the models
      const directionalLight = new THREE.DirectionalLight(0xffffff)
      directionalLight.position.set(0, -70, 100).normalize()
      this.scene.add(directionalLight)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff)
      directionalLight2.position.set(0, 70, 100).normalize()
      this.scene.add(directionalLight2)
      // add all generated cylinders to scene
      R.forEach((line) => this.scene.add(line))(lines)
      this.map = map
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

      clickHandler = (e) => this.raycast(this, e)
      map.getCanvas().addEventListener('mousedown', clickHandler, false)
      map.moveLayer('3d-model')
    },
    onRemove: function () {
      this.map.getCanvas().removeEventListener('mouseDown', clickHandler)
    },
    raycast: (layer, e) => {
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
      const mousePosition = new THREE.Vector3(mouse.x, mouse.y, 1).applyMatrix4(
        camInverseProjection
      )
      const viewDirection = mousePosition
        .clone()
        .sub(cameraPosition)
        .normalize()

      layer.raycaster.set(cameraPosition, viewDirection)

      // calculate objects intersecting the picking ray
      const intersects = layer.raycaster.intersectObjects(lines, true)
      if (intersects.length) {
        e.preventDefault()
        console.log(intersects)
      }
    },
    render: function (gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix)
      // Note: Y must be inverted, otherwise weird y rendering results
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform._zoom
      const scale = 1 / Math.pow(2, zoom)
      // Note: Scaling isn't perfect due to perspective changes
      R.forEach((line) => line.scale.set(1, 1, scale))(lines)
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }
  return <Layer {...customLayer} />
})
