import { MercatorCoordinate } from 'maplibre-gl'
import * as R from 'ramda'
import { memo } from 'react'
import { Layer } from 'react-map-gl'
import * as THREE from 'three'

// Generate custom cylinder segments to allow for constant pixel sizing
const generateSegments = (curve, segments = 60) => {
  const points = curve.getPoints(segments)
  return R.map((idx) => {
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 2)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    })
    const cylinder = new THREE.Mesh(geometry, material)
    const midpoint = new THREE.Vector3(
      (points[idx].x + points[idx + 1].x) / 2,
      (points[idx].y + points[idx + 1].y) / 2,
      (points[idx].z + points[idx + 1].z) / 2
    )
    cylinder.position.x = midpoint.x
    cylinder.position.y = midpoint.y
    cylinder.position.z = midpoint.z
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
  const lines = generateSegments(curve)

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
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform.tileZoom + this.map.transform.zoomFraction
      const scale = 1 / Math.pow(2, zoom)
      R.forEach((line) => line.scale.set(scale, scale, scale))(lines)
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }
  return <Layer {...customLayer} />
})
