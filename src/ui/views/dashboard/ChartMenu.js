import {
  Badge,
  ButtonGroup,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Menu,
  MenuItem,
  Switch,
} from '@mui/material'
import { memo } from 'react'
import { FaFilter } from 'react-icons/fa'
import {
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdMoreVert,
} from 'react-icons/md'

import { useMenu } from '../../../utils/hooks'

import { TooltipButton } from '../../compound'

const styles = {
  root: {
    width: 'auto',
    position: 'absolute',
    p: 0.5,
    top: '12px',
    right: 0,
    zIndex: 1,
  },
  actionBtn: {
    button: {
      width: '42px',
      borderRadius: 1,
      opacity: 0.8,
      ':hover': {
        bgcolor: 'background.paper',
        opacity: 1,
      },
    },
    bgcolor: 'background.paper',
    mx: 0.5,
  },
}

const ToggleMenuItem = ({ disabled, label, value, onClick }) => (
  <MenuItem {...{ disabled }}>
    <FormGroup>
      <FormControlLabel
        {...{ label }}
        control={
          <Switch
            sx={{ mr: 1 }}
            size="small"
            checked={value}
            onChange={onClick}
          />
        }
      />
    </FormGroup>
  </MenuItem>
)

const BaseMenuItem = ({ badgeProps, ReactIcon, label, onClick }) => (
  <MenuItem {...{ onClick }}>
    <Badge {...badgeProps} sx={{ mr: 2 }}>
      <ReactIcon size={20} />
    </Badge>
    {label}
  </MenuItem>
)

const ChartMenu = ({
  activeFilters,
  isMaximized,
  showToolbar,
  showFilter,
  onOpenFilter,
  onShowToolbar,
  onRemoveChart,
  onToggleMaximize,
}) => {
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const handleEventAndCloseMenu = (onEvent) => (e) => {
    onEvent(e)
    handleCloseMenu()
  }

  // TODO: implement
  // const handleDuplicate = () => {
  // }

  return (
    <Grid
      container
      sx={[styles.root, !showToolbar && { top: isMaximized ? '4px' : '8px' }]}
    >
      <ButtonGroup
        variant="contained"
        sx={[styles.actionBtn, showToolbar && { bgcolor: 'transparent' }]}
      >
        <TooltipButton
          title="View more Actions"
          placement="bottom-start"
          onClick={handleOpenMenu}
        >
          <Badge
            color="warning"
            variant="dot"
            invisible={!showFilter || activeFilters.length < 1}
          >
            <MdMoreVert />
          </Badge>
        </TooltipButton>
      </ButtonGroup>
      <Menu
        {...{ anchorEl }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { width: '20ch' } } }}
        sx={{ p: 0 }}
      >
        <ToggleMenuItem
          label="Show Toolbar"
          value={showToolbar}
          onClick={onShowToolbar}
        />
        <BaseMenuItem
          label={isMaximized ? 'Minimize' : 'Maximize'}
          ReactIcon={isMaximized ? MdFullscreenExit : MdFullscreen}
          onClick={handleEventAndCloseMenu(onToggleMaximize)}
        />
        <Divider />
        {showFilter && (
          <BaseMenuItem
            label="Filter Data"
            ReactIcon={FaFilter}
            badgeProps={{
              color: 'primary',
              badgeContent: activeFilters.length,
              invisible: activeFilters.length < 1,
            }}
            onClick={handleEventAndCloseMenu(onOpenFilter)}
          />
        )}
        {showFilter && <Divider />}
        <BaseMenuItem
          label="Remove Chart"
          ReactIcon={MdClose}
          onClick={handleEventAndCloseMenu(onRemoveChart)}
        />
        {/* <MenuItem sx={{ pl: 6 }} onClick={onShowAllToolbars}>
              Some action with no icon
            </MenuItem> */}
        {/* <MenuItem
              disabled={pageLayout.length > 3}
              onClick={handleDuplicate}
            >
              <MdCopyAll fontSize={20} style={{ marginRight: '12px' }} />
              Duplicate this Chart
            </MenuItem> */}
      </Menu>
    </Grid>
  )
}

export default memo(ChartMenu)
