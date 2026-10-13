import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  computeEdgePan,
  includesPath,
  readStoredFlag,
  writeStoredFlag,
} from '.'

import { mutateLocal } from '../data/local'
import { selectSync } from '../data/selectors'

export const useToggle = (defaultValue, stopPropagation = false) => {
  const [value, setValue] = useState(defaultValue)
  const handleToggleValue = useCallback(
    (event) => {
      setValue(!value)
      if (stopPropagation) {
        event.stopPropagation()
      }
    },
    [stopPropagation, value]
  )
  return [value, handleToggleValue, setValue]
}

export const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleOpenMenu = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = (event) => {
    if (event != null) event.stopPropagation()
    setAnchorEl(null)
  }

  return { anchorEl, handleOpenMenu, handleCloseMenu }
}

export const useModal = () => {
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  return { modalOpen, handleOpenModal, handleCloseModal }
}

export const useIndexedModal = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const handleOpenModal = useCallback((index) => {
    setOpenIndex(index)
  }, [])

  const handleCloseModal = useCallback(() => {
    setOpenIndex(null)
  }, [])

  return { openIndex, handleOpenModal, handleCloseModal }
}

/**
 * A hook to dispatch the mutateLocal action as a callback
 * @param {function} getArgs - A function that accepts the arguement to the callback and returns the argument to the mutateLocal action
 * - All deps for this function must be included in the deps array
 * @param {Array} deps - An array of dependencies to pass to useCallback
 * @return {function} A callback that dispatches the mutateLocal action with the provided argument
 */
export const useMutateState = (getArgs, deps) => {
  const dispatch = useDispatch()

  return useCallback(
    (param) => dispatch(mutateLocal(getArgs(param))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, ...deps]
  )
}

/**
 * A hook to dispatch the `mutateLocal` action with sync behavior.
 *
 * @param {function} getArgs - A function that accepts the arguments to the callback and returns the arguments to the `mutateLocal` action.
 * @param {Array} deps - An array of dependencies to pass to `useCallback` (make sure all `getArgs` dependencies are included).
 * @return {function} A callback that dispatches the `mutateLocal` action with sync handling based on the provided argument.
 */
export const useMutateStateWithSync = (getArgs, deps) => {
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  return useCallback(
    (...params) => {
      const args = getArgs(...params)
      if (!args) return
      dispatch(
        mutateLocal({
          sync: !includesPath(Object.values(sync), args.path),
          ...args,
        })
      )
    },
    // NOTE: `dispatch` is not included in the deps because it
    // is stable in Redux and will not change between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sync, ...deps]
  )
}

/**
 * Drives the auto-pan-while-dragging behavior shared by the `latLngPath` and
 * `latLngMap` popup maps: panning the camera once a dragged point nears the
 * container's edge, keeping the dragged point glued under the cursor as the
 * camera pans, and working around `mapboxgl.Marker`'s own drag tracking
 * being scoped to the map's canvas rather than the document (see the
 * `useEffect` below).
 *
 * `getMap` must return the live map instance (or `null`), and `setViewState`
 * must accept a plain `{ longitude, latitude, zoom }` object (not an updater
 * function - the auto-pan loop reads live refs, not React state, so there's
 * nothing for an updater to close over).
 *
 * Callers wire `registerDrag(event, position)` into their own `onDrag` (after
 * resolving any feature-specific position adjustment, e.g. snap-to-point) and
 * `endDrag()` into the start of their own `onDragEnd`, before computing the
 * final dropped position from `event.lngLat`.
 */
export const useDragAutoPan = ({ getMap, setViewState }) => {
  const [dragPosition, setDragPosition] = useState(null)
  // Mirrors `dragPosition` for the auto-pan loop's synchronous reads/writes
  // (there's no library-side ground truth for this one, unlike the camera's
  // own position, which the loop reads directly via `map.getCenter()`), and
  // holds the live `mapboxgl.Marker` instance so that loop can reposition it
  // immediately, without waiting on a React re-render, as the camera pans
  // underneath it.
  const dragPositionRef = useRef(null)
  const markerInstanceRef = useRef(null)
  // Releasing a drag (with auto-pan now able to carry it well past the
  // popup's own bounds) outside the component's container makes the
  // browser's native `click` event synthesize against the nearest common
  // ancestor of where the drag started and where it ended - which is
  // outside the component, even though the gesture began inside it. That
  // reads as a legitimate click-away to a `ClickAwayListener`, closing the
  // popup right as `onDragEnd` is committing the point. Callers check and
  // reset this ref in their own `ClickAwayListener.onClickAway` to suppress
  // exactly one click-away immediately following a drag-end.
  const suppressClickAwayRef = useRef(false)
  const panVectorRef = useRef([0, 0])
  const panFrameRef = useRef(null)

  const stopAutoPan = useCallback(() => {
    if (panFrameRef.current != null) {
      cancelAnimationFrame(panFrameRef.current)
      panFrameRef.current = null
    }
    panVectorRef.current = [0, 0]
  }, [])

  // `<ReactMapGl>` is a controlled component whose own reconciliation
  // re-applies `viewState` to the real camera every frame, so an imperative
  // `map.panBy()` call would get immediately reverted. Panning here works
  // around that the same way the dragged marker's live position does:
  // compute the panned center via a project/unproject round trip and update
  // `viewState` directly - the same channel `onMove` and the zoom controls
  // already go through.
  //
  // The "current center" this reads must be the real, ground-truth camera
  // position (`map.getCenter()`), not the caller's own tracked `viewState`:
  // when `maxBounds` is set, `@vis.gl/react-mapbox` applies the requested
  // longitude/latitude to the real transform, then runs the transform's own
  // `_constrain()` to clamp it - so the real camera ends up correctly pinned
  // at the boundary, but the *value that was requested* (what the caller's
  // own state would keep tracking) is never corrected back. Reading that
  // state here would let it run away further every frame once pinned,
  // computing this frame's pan from an already-wrong "current position".
  const startAutoPan = useCallback(() => {
    if (panFrameRef.current != null) return
    const step = () => {
      const [panX, panY] = panVectorRef.current
      const map = getMap()
      if (map && (panX !== 0 || panY !== 0)) {
        const center = map.getCenter()
        const centerPixel = map.project([center.lng, center.lat])
        const newCenter = map.unproject([
          centerPixel.x + panX,
          centerPixel.y + panY,
        ])
        // Keep the dragged point glued under the cursor's (or finger's)
        // fixed screen position as the camera pans underneath it: at an
        // unchanged zoom, panning by a fixed pixel amount shifts every
        // point's geographic position by the same delta as the center's, so
        // apply that same delta here instead of re-projecting against a
        // transform that won't reflect this pan until next render. Read via
        // a plain value (not a `setViewState` updater function) and update
        // the marker directly, rather than only through React state, so
        // neither waits on a render that may not have happened yet by the
        // next animation frame.
        if (dragPositionRef.current) {
          const deltaLng = newCenter.lng - center.lng
          const deltaLat = newCenter.lat - center.lat
          const nextDragPosition = [
            dragPositionRef.current[0] + deltaLng,
            dragPositionRef.current[1] + deltaLat,
          ]
          dragPositionRef.current = nextDragPosition
          markerInstanceRef.current?.setLngLat(nextDragPosition)
          setDragPosition(nextDragPosition)
        }
        setViewState({
          longitude: newCenter.lng,
          latitude: newCenter.lat,
          zoom: map.getZoom(),
        })
      }
      panFrameRef.current = requestAnimationFrame(step)
    }
    panFrameRef.current = requestAnimationFrame(step)
  }, [getMap, setViewState])
  useEffect(() => stopAutoPan, [stopAutoPan])

  // `mapboxgl.Marker`'s own drag tracking (`_onMove`/`_onUp`) is wired via
  // `map.on('mousemove', ...)`/`map.once('mouseup', ...)` - events scoped to
  // the map's own canvas, not the document. Once the cursor leaves the
  // canvas mid-drag (which auto-panning now makes routine), the native event
  // never reaches it: the marker's position freezes, `dragend` never fires,
  // and its internal drag state (and this auto-pan loop) are left stuck.
  // `_onUp` (its own cleanup-then-fire-dragend method, "private" by
  // convention only) is still a real, callable method, so detect the actual
  // release at the document level and invoke it ourselves, letting mapbox
  // finish the drag normally - with whatever position the marker was last
  // legitimately at - into the caller's own `onDragEnd` via its real
  // `dragend` event.
  useEffect(() => {
    const handleGlobalRelease = () => {
      markerInstanceRef.current?._onUp()
    }
    document.addEventListener('mouseup', handleGlobalRelease)
    document.addEventListener('touchend', handleGlobalRelease)
    return () => {
      document.removeEventListener('mouseup', handleGlobalRelease)
      document.removeEventListener('touchend', handleGlobalRelease)
    }
  }, [])

  const registerDrag = useCallback(
    (event, position) => {
      markerInstanceRef.current = event.target
      dragPositionRef.current = position
      setDragPosition(position)

      const map = getMap()
      if (!map) return
      const container = map.getContainer()
      const pixel = map.project(position)
      panVectorRef.current = computeEdgePan(
        pixel,
        container.clientWidth,
        container.clientHeight
      )
      startAutoPan()
    },
    [getMap, startAutoPan]
  )

  const endDrag = useCallback(() => {
    suppressClickAwayRef.current = true
    stopAutoPan()
    setDragPosition(null)
    dragPositionRef.current = null
    markerInstanceRef.current = null
  }, [stopAutoPan])

  return {
    dragPosition,
    suppressClickAwayRef,
    registerDrag,
    endDrag,
  }
}

/**
 * Live (lat, lng) readout for whatever's under the cursor while a popup map
 * is open, togglable and persisted per `storageKey` (e.g. keyed by prop id),
 * independently of the map's own open/closed state.
 *
 * `cursorPosition` is `null` while the cursor's outside the map (or the
 * toggle is off), so a readout can fade away rather than show a stale
 * position. `cursorDisplayRef` keeps the last real position around through
 * that fade-out, so it doesn't flash empty right as the cursor leaves.
 */
export const useCoordinateReadout = (storageKey) => {
  const [cursorPosition, setCursorPosition] = useState(null)
  const cursorDisplayRef = useRef(null)
  const [coordsEnabled, setCoordsEnabledState] = useState(() =>
    readStoredFlag(storageKey)
  )
  const setCoordsEnabled = useCallback(
    (enabledFlag) => {
      setCoordsEnabledState(enabledFlag)
      writeStoredFlag(storageKey, enabledFlag)
      if (!enabledFlag) setCursorPosition(null)
    },
    [storageKey]
  )
  const handleMapMouseMove = useCallback(
    (event) => {
      if (!coordsEnabled) return
      const next = [event.lngLat.lng, event.lngLat.lat]
      cursorDisplayRef.current = next
      setCursorPosition(next)
    },
    [coordsEnabled]
  )
  const handleMapMouseLeave = useCallback(() => setCursorPosition(null), [])

  return {
    coordsEnabled,
    setCoordsEnabled,
    cursorPosition,
    cursorDisplayRef,
    handleMapMouseMove,
    handleMapMouseLeave,
  }
}

export const useMutateWithSyncFactory = (getArgs, deps) => {
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  return useCallback(
    (...params) => {
      const argsOrFn = getArgs(...params)
      // Resolve high-order functions
      if (typeof argsOrFn === 'function') return argsOrFn
      if (!argsOrFn) return
      dispatch(
        mutateLocal({
          sync: !includesPath(Object.values(sync), argsOrFn.path),
          ...argsOrFn,
        })
      )
    },
    // NOTE: `dispatch` is not included in the deps because it
    // is stable in Redux and will not change between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sync, ...deps]
  )
}
