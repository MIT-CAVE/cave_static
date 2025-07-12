import { Box, Button, Menu, MenuItem, Paper } from '@mui/material'
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md'

import OverflowText from './OverflowText'

import { useMenu } from '../../utils/hooks'

import { forceArray } from '../../utils'

export const SimpleDropdown = ({
  value,
  optionsList,
  fullWidth,
  marquee,
  enabled = true,
  slotProps = {},
  getLabel = (label) => label,
  onSelect,
  ...props
}) => {
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()
  return (
    <Paper
      elevation={0}
      {...slotProps.paper}
      sx={[
        { mx: 0.5, my: 1.5 },
        fullWidth && { width: '100%' },
        ...forceArray(slotProps.paper?.sx),
      ]}
    >
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
          {anchorEl ? (
            <MdArrowDropUp size={20} />
          ) : (
            <MdArrowDropDown size={20} />
          )}
        </Box>
      </Button>
      <Menu
        id="simple-menu"
        {...{ anchorEl }}
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
