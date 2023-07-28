import { Box, Button, Menu, MenuItem, Paper } from '@mui/material'
import React from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

export const SimpleDropdown = ({
  value,
  onSelect,
  optionsList,
  getLabel = (label) => label,
  enabled = true,
  paperProps,
  marquee,
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
        fullWidth
        variant="outlined"
        color="greyscale"
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={enabled ? handleClick : () => {}}
        {...props}
      >
        {marquee ? <OverflowText text={getLabel(value)} /> : getLabel(value)}
        <Box
          component="span"
          display="flex"
          alignItems="center"
          justifyContent="end"
          paddingLeft="4px"
        >
          <FetchedIcon
            size={20}
            iconName={
              anchorEl == null ? 'md/MdArrowDropDown' : 'md/MdArrowDropUp'
            }
          />
        </Box>
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
