import { MercatorCoordinate } from 'maplibre-gl'
import * as R from 'ramda'
import { memo, useEffect, useRef } from 'react'
import { Layer, useMap } from 'react-map-gl'
import * as THREE from 'three'

import { HIGHLIGHT_COLOR } from '../../../utils/constants'

import { rgbStrToArray } from '../../../utils'

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

// export const Node3D = ({ nodes, id, key }) => {
//   return nodes.map((node) => (
//     <Marker
//       id={id}
//       key={key}
//       longitude={node.geometry.coordinates[0]}
//       latitude={node.geometry.coordinates[1]}
//       rotationAlignment="horizon"
//       offset={[0, -node.geometry.coordinates[2]]}
//       style={{
//         width: `${node.geometry.coordinates[2] * 2}px`,
//         height: `${node.geometry.coordinates[2] * 2}px`,
//         backgroundSize: 'cover',
//         backgroundImage:
//           "url('https://docs.mapbox.com/mapbox-gl-js/assets/pin.svg')",
//       }}
//     />
//   ))
// }

// function lnglat_to_globe(lnglat, opts = {}) {
//   let { r = 1, mode = 'degrees' } = opts
//   let lat = lnglat[1]
//   let lng = lnglat[0]
//   let R

//   // Third component represents elevation, if it exists
//   if (lnglat.length > 2) {
//     R = 1.001 + 0.000005 * lnglat[2]
//   } else {
//     R = r
//   }
//   if (mode === 'degrees') {
//     lat = (lat * Math.PI) / 180
//     lng = (lng * Math.PI) / 180
//   }

//   // Convert latitude to spherical phi
//   let phi = Math.PI / 2 - lat
//   let theta = lng
//   let x = R * Math.sin(phi) * Math.cos(theta)
//   if (Math.abs(x) < 0.000001) {
//     x = 0
//   }
//   let y = R * Math.sin(phi) * Math.sin(theta)
//   if (Math.abs(y) < 0.000001) {
//     y = 0
//   }
//   let z = R * Math.cos(phi)
//   if (Math.abs(z) < 0.000001) {
//     z = 0
//   }
//   return { x, y, z }
// }

// function lngLatToXYZ(longitude, latitude, globeRadius) {
//   const phi = (90 - latitude) * (Math.PI / 180) // Convert latitude to radians
//   const theta = (longitude + 180) * (Math.PI / 180) // Convert longitude to radians

//   const x = -globeRadius * Math.sin(phi) * Math.cos(theta)
//   const y = globeRadius * Math.cos(phi)
//   const z = globeRadius * Math.sin(phi) * Math.sin(theta)

//   return { x, y, z }
// }

const lngLatToXYZ = (map, lngLat, altitude = 0) => {
  const mercatorCoordinate = MercatorCoordinate.fromLngLat(lngLat, altitude)
  return { x: mercatorCoordinate.x, y: mercatorCoordinate.y, z: 10 }
}

const createNodes = (nodes, findCoordinates, findLngLat) => {
  return nodes.map((n) => {
    const nodeLocation = findCoordinates(n)
    const geometry = new THREE.SphereGeometry(0.0025)
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
    const node = new THREE.Mesh(geometry, material)
    node.position.set(nodeLocation.x, nodeLocation.y, 0.05)
    node.userData = findLngLat(n)
    return node
  })
}

export const Node3D = memo(({ nodes, onClick = () => {} }) => {
  const { current: map } = useMap()

  // const handleMouseMove = (event) => {
  //   if (map) {
  //     const layer = map.getLayer('3d-node-layer')
  //     if (layer) {
  //       const { lngLat, point } = event
  //       const { lng, lat } = lngLat
  //       const { x, y } = point

  //       // console.log('Screen', point)
  //     }
  //   }
  // }

  // useEffect(() => {
  //   if (map) {
  //     map.on('mousemove', handleMouseMove)
  //     return () => map.off('mousemove', handleMouseMove)
  //   }
  // }, [map])

  // const clickHandler = useRef()
  // const hoverHandler = useRef()

  useEffect(() => {
    if (map) {
      const layer = map.getLayer('3d-node-layer')
      if (layer) {
        layer.implementation.updateNodes(
          createNodes(
            nodes,
            (n) => {
              const coordinates = lngLatToXYZ(
                map,
                [n.geometry.coordinates[0], n.geometry.coordinates[1]],
                n.geometry.coordinates[2]
              )
              return {
                ...coordinates,
                y: -coordinates.y,
              }
            },
            (n) => {
              return {
                lng: n.geometry.coordinates[0],
                lat: n.geometry.coordinates[1],
              }
            }
          )
        )
      }
    }
  }, [nodes, map])

  // useEffect(() => {
  //   if (map) {
  //     const layer = map.getLayer('3d-node-layer')
  //     if (layer) {
  //       layer.implementation.onClick = onClick
  //     }
  //   }
  // }, [onClick, map])

  // useEffect(() => {
  //   return () => {
  //     if (map) {
  //       const canvas = map.getCanvas()
  //       if (clickHandler.current) {
  //         canvas.removeEventListener('click', clickHandler.current)
  //       }
  //       if (hoverHandler.current) {
  //         canvas.removeEventListener('mousemove', hoverHandler.current)
  //       }
  //     }
  //   }
  // }, [map])

  const customLayer = {
    id: '3d-node-layer',
    type: 'custom',
    renderingMode: '3d',
    highlightedId: -1,
    oldColor: -1,
    onClick,
    onAdd: function (map, gl) {
      this.camera = new THREE.PerspectiveCamera()
      this.scene = new THREE.Scene()
      this.map = map
      this.nodes = createNodes(
        nodes,
        (n) => {
          const coordinates = lngLatToXYZ(
            this.map,
            [n.geometry.coordinates[0], n.geometry.coordinates[1]],
            n.geometry.coordinates[2]
          )
          return {
            ...coordinates,
            y: -coordinates.y,
          }
        },
        (n) => {
          return {
            lng: n.geometry.coordinates[0],
            lat: n.geometry.coordinates[1],
          }
        }
      )
      this.nodes.forEach((node) => this.scene.add(node))

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })
      this.renderer.autoClear = false
      this.raycaster = new THREE.Raycaster()
      // this.raycaster.near = -1
      // this.raycaster.far = 1e6

      // clickHandler.current = (e) => this.raycast(e, true)
      // hoverHandler.current = (e) => this.raycast(e, false)
      // map.getCanvas().addEventListener('mousemove', hoverHandler.current, false)
      // map.getCanvas().addEventListener('click', clickHandler.current, false)
      map.moveLayer('3d-node-layer')
    },
    // onRemove: function () {
    //   this.map
    //     .getCanvas()
    //     .removeEventListener('mousemove', hoverHandler.current)
    //   this.map.getCanvas().removeEventListener('click', clickHandler.current)
    // },
    updateNodes: function (newNodes) {
      this.scene.remove.apply(this.scene, this.scene.children)
      this.nodes = createNodes(
        newNodes,
        (n) => n.position,
        (n) => n.userData
      )
      this.nodes.forEach((node) => this.scene.add(node))
    },
    // raycast: function (e, click) {
    //   // const layer = this
    //   const point = { x: e.layerX, y: e.layerY }
    //   const mouse = new THREE.Vector2()
    //   mouse.x = (point.x / e.srcElement.width) * 2 - 1
    //   mouse.y = 1 - (point.y / e.srcElement.height) * 2

    //   const camInverseProjection = new THREE.Matrix4()
    //     .copy(this.camera.projectionMatrix)
    //     .invert()
    //   const cameraPosition = new THREE.Vector3().applyMatrix4(
    //     camInverseProjection
    //   )
    //   const mousePosition = new THREE.Vector3(mouse.x, mouse.y, 1).applyMatrix4(
    //     camInverseProjection
    //   )
    //   const viewDirection = mousePosition
    //     .clone()
    //     .sub(cameraPosition)
    //     .normalize()

    //   this.raycaster.set(cameraPosition, viewDirection)

    //   const intersects = this.raycaster.intersectObjects(this.nodes, true)
    //   if (intersects.length) {
    //     e.stopImmediatePropagation()
    //     if (click) this.onClick(intersects[0].object.userData)
    //   }
    // },
    render: function (gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix)
      const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1))
      const zoom = this.map.transform._zoom
      const scale = 40 / Math.pow(2, zoom)
      this.nodes.forEach((node) => {
        // node.up = this.camera.up
        node.scale.set(scale, scale, 1)
        // const zAdjustment = (20 - zoom) * 0.006 // Example adjustment, tweak as needed
        // console.log(zAdjustment)
        // node.position.z = zAdjustment
      })
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    },
  }

  return <Layer {...customLayer} />
})
