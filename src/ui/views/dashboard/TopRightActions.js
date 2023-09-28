import { Divider, Grid, IconButton, Menu, MenuItem } from '@mui/material'
import { memo } from 'react'
import {
  MdCheck,
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdMoreVert,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import {
  selectPageLayout,
  selectDashboardLockedLayout,
} from '../../../data/selectors'
import { useMenu } from '../../../utils/hooks'

const BaseMenuItem = ({ label, value, onClick }) => (
  <MenuItem {...{ onClick }}>
    <MdCheck
      visibility={value ? 'visible' : 'hidden'}
      size={20}
      style={{ marginRight: '12px' }}
    />
    {label}
  </MenuItem>
)

const TopRightActions = ({
  isMaximized,
  showToolbar,
  showAllToolbars,
  hideAllToolbars,
  onHideAllToolbars,
  onRemoveView,
  onShowAllToolbars,
  onShowToolbar,
  onToggleMaximize,
  ...props
}) => {
  const pageLayout = useSelector(selectPageLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const handleRemoveView = () => {
    onRemoveView()
    handleCloseMenu()
  }
  // TODO: implement
  // const handleDuplicate = () => {
  // }

  return (
    <Grid container {...props}>
      {pageLayout.length > 1 && (
        <Grid item>
          <IconButton onClick={onToggleMaximize}>
            {isMaximized ? <MdFullscreenExit /> : <MdFullscreen />}
          </IconButton>
        </Grid>
      )}

      {!lockedLayout && (
        <>
          <IconButton onClick={handleOpenMenu}>
            <MdMoreVert />
          </IconButton>
          <Menu
            {...{ anchorEl }}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            slotProps={{ paper: { sx: { width: '20ch' } } }}
          >
            <BaseMenuItem
              label="Show Toolbar"
              value={showToolbar}
              onClick={onShowToolbar}
            />
            <Divider />
            <BaseMenuItem
              label="Show All Toolbars"
              value={showAllToolbars}
              onClick={onShowAllToolbars}
            />
            <BaseMenuItem
              label="Hide All Toolbars"
              value={hideAllToolbars}
              onClick={onHideAllToolbars}
            />
            <Divider />

            {/* <MenuItem sx={{ pl: 6 }} onClick={onShowAllToolbars}>
              Some action with no icon
            </MenuItem> */}

            {/* <MenuItem
              disabled={pageLayout.length > 3}
              onClick={handleDuplicate}
            >
              <MdCopyAll size={20} style={{ marginRight: '12px' }} />
              Duplicate this View
            </MenuItem> */}
            <MenuItem onClick={handleRemoveView}>
              <MdClose size={20} style={{ marginRight: '12px' }} />
              Remove from Page
            </MenuItem>
          </Menu>
        </>
      )}
    </Grid>
  )
}

export default memo(TopRightActions)
