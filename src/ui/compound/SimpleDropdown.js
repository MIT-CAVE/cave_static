import { Button, Menu, MenuItem, Paper } from '@mui/material'
import React from 'react'

export const SimpleDropdown = ({
  value,
  onSelect,
  optionsList,
  getLabel = (label) => label,
  enabled = true,
  paperProps,
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
    <Paper elevation={0} {...paperProps} sx={{ mx: 0.5, my: 1.5 }}>
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
    </Paper>
  )
}
