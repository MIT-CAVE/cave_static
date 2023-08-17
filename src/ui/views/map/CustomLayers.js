import { MercatorCoordinate } from 'maplibre-gl'
import * as R from 'ramda'
import { memo, useMemo } from 'react'
import { Layer } from 'react-map-gl'
import * as THREE from 'three'

// Generate custom cylinder segments to allow for constant pixel sizing
const generateSegments = (curve, segments = 80) => {
  const points = curve.getPoints(segments)
  return R.map((idx) => {
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
    const geometry = new THREE.CylinderGeometry(0.01, 0.01, hypotenuse, 2)
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
    return cylinder
  })(R.range(0, R.length(points) - 1))
}

export const ArcLayer3D = memo(({ ...props }) => {
  const modelOrigin = [148.9819, -35.39847]
  const modelDestination = [-71.0597, 42.3584]
  const modelAltitude = 0
  const modelOriginAsMercatorCoordinate = MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  )
  const modelDestinationAsMercatorCoordinate = MercatorCoordinate.fromLngLat(
    modelDestination,
    modelAltitude
  )
  // Generate meshes from curve
  const lines = useMemo(() => {
    // Generate curve to follow between points
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(
        modelOriginAsMercatorCoordinate.x,
        -modelOriginAsMercatorCoordinate.y,
        0
      ),
      new THREE.Vector3(
        modelOriginAsMercatorCoordinate.x,
        -modelOriginAsMercatorCoordinate.y,
        0.25
      ),
      new THREE.Vector3(
        modelDestinationAsMercatorCoordinate.x,
        -modelDestinationAsMercatorCoordinate.y,
        0.25
      ),
      new THREE.Vector3(
        modelDestinationAsMercatorCoordinate.x,
        -modelDestinationAsMercatorCoordinate.y,
        0
      )
    )
    return generateSegments(curve)
  }, [
    modelDestinationAsMercatorCoordinate.x,
    modelDestinationAsMercatorCoordinate.y,
    modelOriginAsMercatorCoordinate.x,
    modelOriginAsMercatorCoordinate.y,
  ])

  // configuration of the custom layer per the CustomLayerInterface
  const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, gl) {
      this.camera = new THREE.Camera()
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
    },
    render: function (gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix)
      // Note: Y must be inverted, otherwise weird y rendering results
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform._zoom
      const scale = 1 / Math.pow(2, zoom)
      // Note: Scaling isn't perfect due to perspective changes
      R.forEach((line) => line.scale.set(scale, 1, scale))(lines)
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }
  return <Layer {...customLayer} />
})
