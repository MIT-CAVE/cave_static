import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { includesPath } from '.'

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

export const useChartTools = () => {
  const [chartToolsOpen, setChartToolsOpen] = useState(false)

  const handleOpenChartTools = () => {
    setChartToolsOpen(true)
  }

  const handleCloseChartTools = () => {
    setChartToolsOpen(false)
  }

  return { chartToolsOpen, handleOpenChartTools, handleCloseChartTools }
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
