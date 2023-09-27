import { useState } from 'react'

// TODO: Reuse for `SessionPane` and `SimpleDropdown`
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
