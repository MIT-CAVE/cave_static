import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { mutateLocal } from '../data/local'

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
