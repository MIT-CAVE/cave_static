import { Button, Menu, MenuItem } from '@mui/material'
import React from 'react'

export const SimpleDropdown = ({
  value,
  onSelect,
  optionsList,
  getLabel = (label) => label,
  enabled = true,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <Button
        color="greyscale"
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={enabled ? handleClick : () => {}}
        {...props}
      >
        {getLabel(value)}
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {optionsList.map((name) => (
          <MenuItem
            key={name}
            onClick={() => {
              handleClose()
              onSelect && onSelect(name)
            }}
          >
            {getLabel(name)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}
