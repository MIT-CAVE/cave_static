import { Box, Button, Menu, MenuItem, Paper } from '@mui/material'
import React from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { useMenu } from '../../utils/hooks'

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
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  return (
    <Paper elevation={0} {...paperProps} sx={{ mx: 0.5, my: 1.5 }}>
      <Button
        fullWidth
        variant="outlined"
        color="greyscale"
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={enabled ? handleOpenMenu : () => {}}
        {...props}
      >
        {marquee ? <OverflowText text={getLabel(value)} /> : getLabel(value)}
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            pl: 0.5,
          }}
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
        onClose={handleCloseMenu}
      >
        {optionsList.map((name) => (
          <MenuItem
            key={name}
            onClick={() => {
              handleCloseMenu()
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
