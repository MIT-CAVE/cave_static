import {
  Badge,
  ButtonGroup,
  Divider,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Select,
  Menu,
  MenuItem,
  Switch,
} from '@mui/material'
import { memo } from 'react'
import {
  FaSortNumericUp,
  FaSortNumericDown,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaChartBar,
  FaFilter,
} from 'react-icons/fa'
import {
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdMoreVert,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import { selectEditLayoutMode } from '../../../data/selectors'
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
  isMaximized,
  isGroupedOutput,
  defaultToZero,
  onToggleDefaultToZero,
  showNA,
  onToggleShowNA,
  showToolbar,
  onShowToolbar,
  onRemoveChart,
  onToggleMaximize,
  chartHoverOrder,
  onChartHover,
  numFilters,
  onOpenFilter,
  onOpenChartTools,
}) => {
  const editLayoutMode = useSelector(selectEditLayoutMode)
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
      sx={[
        styles.root,
        !showToolbar && { top: isMaximized ? '4px' : '8px' },
        !isMaximized && editLayoutMode && { top: '20px', right: '8px' },
      ]}
    >
      <ButtonGroup
        variant="contained"
        orientation="vertical"
        sx={[styles.actionBtn, showToolbar && { bgcolor: 'transparent' }]}
      >
        <TooltipButton
          title="Chart Tools"
          placement="bottom-start"
          onClick={onOpenChartTools}
        >
          <Badge
            {...{
              color: 'info',
              badgeContent: numFilters,
              invisible: numFilters < 1,
            }}
          >
            <FaChartBar />
          </Badge>
        </TooltipButton>
        {isGroupedOutput && (
          <TooltipButton
            title="Filter"
            placement="bottom-start"
            onClick={onOpenFilter}
          >
            <Badge
              {...{
                color: 'info',
                badgeContent: numFilters,
                invisible: numFilters < 1,
              }}
            >
              <FaFilter />
            </Badge>
          </TooltipButton>
        )}
        <TooltipButton
          title="View more Actions"
          placement="bottom-start"
          onClick={handleOpenMenu}
        >
          <MdMoreVert />
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
        <FormLabel sx={{ ml: 2 }}>Chart Hover</FormLabel>
        <Select value={chartHoverOrder} onChange={onChartHover} sx={{ ml: 2 }}>
          <MenuItem value="seriesAsc">
            <FaSortAlphaDown fontSize={20} /> Name
          </MenuItem>
          <MenuItem value="seriesDesc">
            <FaSortAlphaUp fontSize={20} /> Name
          </MenuItem>
          <MenuItem value="valueAsc">
            <FaSortNumericDown fontSize={20} /> Value
          </MenuItem>
          <MenuItem value="valueDesc">
            <FaSortNumericUp fontSize={20} /> Value
          </MenuItem>
        </Select>
        <Divider />
        {isGroupedOutput && [
          <ToggleMenuItem
            key="defaultToZero"
            label="0 NA Values"
            value={defaultToZero}
            onClick={onToggleDefaultToZero}
          />,
          <ToggleMenuItem
            key="showNA"
            label="NA Groupings"
            value={showNA}
            onClick={onToggleShowNA}
          />,
        ]}
        {isGroupedOutput && <Divider />}
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
