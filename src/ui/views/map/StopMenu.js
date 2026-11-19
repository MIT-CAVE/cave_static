import {
  Divider,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  ToggleButton,
} from '@mui/material'
import { useCallback, useState } from 'react'
import { MdClose, MdMoreVert } from 'react-icons/md'
import {
  TbColumnInsertLeft,
  TbColumnInsertRight,
  TbRowInsertBottom,
  TbRowInsertTop,
} from 'react-icons/tb'

import { useMenu } from '../../../utils/hooks'

const ToggleMenuItem = ({ disabled, label, value, onClick }) => (
  <MenuItem {...{ disabled }}>
    <FormControlLabel
      {...{ label }}
      slotProps={{ typography: { variant: 'body2' } }}
      control={
        <Switch
          sx={{ mr: 1 }}
          size="small"
          checked={Boolean(value)}
          onChange={onClick}
        />
      }
    />
  </MenuItem>
)

const BaseMenuItem = ({ disabled, label, reactIcon: ReactIcon, onClick }) => (
  <MenuItem {...{ disabled, onClick }}>
    <ListItemIcon>
      <ReactIcon size={20} />
    </ListItemIcon>
    <ListItemText slotProps={{ primary: { variant: 'body2' } }}>
      {label}
    </ListItemText>
  </MenuItem>
)

/**
 * Menu to add, remove and label a stop of a gradient legend.
 *
 * `index` is the position among the stops of the attribute (color or size),
 * `dataIndices` maps those positions to `gradient.data` indices.
 * Stops that are laid out vertically are added "Above"/"Below", while
 * horizontal ones are added "Before"/"After".
 */
const StopMenu = ({
  index,
  dataIndices,
  editLabelAt,
  attr = 'Color',
  horizontal = false,
  buttonSx,
  onAddAt,
  onRemoveAt,
  onToggleEditLabelAt,
}) => {
  const [menuIndex, setMenuIndex] = useState(null)

  const {
    anchorEl,
    handleOpenMenu: handleOpenMenuRaw,
    handleCloseMenu: handleCloseMenuRaw,
  } = useMenu()

  const handleOpenMenu = useCallback(
    (index) => (event) => {
      handleOpenMenuRaw(event)
      setMenuIndex(index)
    },
    [handleOpenMenuRaw]
  )

  const handleCloseMenu = useCallback(
    (event) => {
      handleCloseMenuRaw(event)
      setMenuIndex(null)
    },
    [handleCloseMenuRaw]
  )

  const dataIndex = dataIndices[index]

  return (
    <div>
      <ToggleButton
        sx={[{ p: '1px', borderRadius: '50%' }, buttonSx]}
        color="warning"
        value="stop-menu"
        selected={index === menuIndex}
        onClick={handleOpenMenu(index)}
      >
        <MdMoreVert size={18} />
      </ToggleButton>
      <Menu
        {...{ anchorEl }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        slotProps={{ paper: { sx: { width: '21.5ch' } } }}
        sx={{ p: 0 }}
      >
        <BaseMenuItem
          label={`Add ${attr} ${horizontal ? 'Before' : 'Above'}`}
          reactIcon={horizontal ? TbColumnInsertLeft : TbRowInsertTop}
          onClick={(event) => {
            onAddAt(index)
            handleCloseMenu(event)
          }}
        />
        <BaseMenuItem
          label={`Add ${attr} ${horizontal ? 'After' : 'Below'}`}
          reactIcon={horizontal ? TbColumnInsertRight : TbRowInsertBottom}
          onClick={(event) => {
            onAddAt(index + 1)
            handleCloseMenu(event)
          }}
        />
        <Divider />
        <ToggleMenuItem
          label="Edit Label"
          onClick={onToggleEditLabelAt(dataIndex)}
          value={editLabelAt[dataIndex]}
        />
        <Divider />
        <BaseMenuItem
          disabled={dataIndices.length < 3}
          label={`Remove ${attr}`}
          reactIcon={MdClose}
          onClick={(event) => {
            onRemoveAt(dataIndex)
            handleCloseMenu(event)
          }}
        />
      </Menu>
    </div>
  )
}

export default StopMenu
