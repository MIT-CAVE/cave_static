import { useState } from 'react'

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
