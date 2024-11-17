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

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  return { anchorEl, handleOpenMenu, handleCloseMenu }
}

export const useFilter = () => {
  const [filterOpen, setFilterOpen] = useState(false)

  const handleOpenFilter = () => {
    setFilterOpen(true)
  }

  const handleCloseFilter = () => {
    setFilterOpen(false)
  }

  return { filterOpen, handleOpenFilter, handleCloseFilter }
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
      // TODO: Add support for high-order functions
      // if (typeof param === 'function') {
      //   return useRecursiveCallback(callback, deps)
      // }
      const args = getArgs(...params)
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
