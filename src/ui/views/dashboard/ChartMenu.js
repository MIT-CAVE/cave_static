import {
  Badge,
  ButtonGroup,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  Menu,
  MenuItem,
  Switch,
  FormControl,
  InputLabel,
} from '@mui/material'
import { memo } from 'react'
import { FaChartBar, FaFilter } from 'react-icons/fa'
import {
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdMoreVert,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import { selectEditLayoutMode } from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'
import { useMenu } from '../../../utils/hooks'

import { Select, TooltipButton } from '../../compound'

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

const UNSORTABLE_HOVERED_CHARTS = [
  chartVariant.TABLE,
  chartVariant.OVERVIEW,
  chartVariant.TREEMAP,
  chartVariant.GAUGE,
]

const MainButtons = ({
  isGroupedOutput,
  numFilters,
  onOpenFilter,
  onOpenChartTools,
  handleOpenMenu,
}) => (
  <ButtonGroup
    variant="contained"
    orientation="vertical"
    sx={[styles.actionBtn]}
  >
    <TooltipButton
      title="Chart Tools"
      placement="bottom-start"
      onClick={onOpenChartTools}
    >
      <FaChartBar />
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
)

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
  defaultToZero,
  onToggleDefaultToZero,
  showNA,
  onToggleShowNA,
  onRemoveChart,
  onToggleMaximize,
  chartHoverOrder,
  onChartHover,
  numFilters,
  onOpenFilter,
  onOpenChartTools,
  vizType,
  chartType,
}) => {
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const isGroupedOutput = vizType === 'groupedOutput'
  const isMap = vizType === 'map'

  const handleEventAndCloseMenu = (onEvent) => (e) => {
    onEvent(e)
    handleCloseMenu()
  }

  // TODO: implement
  // const handleDuplicate = () => {
  // }

  return (
    <Stack
      sx={[
        styles.root,
        !isMaximized && editLayoutMode && { top: '20px', right: '8px' },
      ]}
    >
      <MainButtons
        {...{
          isGroupedOutput,
          numFilters,
          onOpenFilter,
          onOpenChartTools,
          handleOpenMenu,
        }}
      />

      <Menu
        {...{ anchorEl }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { width: '21.5ch' } } }}
        sx={{ p: 0 }}
      >
        <BaseMenuItem
          label={isMaximized ? 'Minimize' : 'Maximize'}
          ReactIcon={isMaximized ? MdFullscreenExit : MdFullscreen}
          onClick={handleEventAndCloseMenu(onToggleMaximize)}
        />
        <Divider />

        {!isMap && !UNSORTABLE_HOVERED_CHARTS.includes(chartType) && (
          <>
            <FormControl
              // size="small"
              fullWidth
              sx={{ m: 1, maxWidth: 'calc(100% - 16px)' }}
            >
              <InputLabel id="chart-hover-label">
                {'Chart Hover \u279D Sort By'}
              </InputLabel>
              <Select
                labelId="chart-hover-label"
                label={'Chart Hover \u279D Sort By'}
                id="chart-hover"
                value={chartHoverOrder}
                iconSize="28px"
                optionsList={[
                  {
                    iconName: 'bs/BsSortAlphaDown',
                    label: 'Name (Asc)',
                    value: 'seriesAsc',
                  },
                  {
                    iconName: 'bs/BsSortAlphaUp',
                    label: 'Name (Desc)',
                    value: 'seriesDesc',
                  },
                  {
                    iconName: 'bs/BsSortNumericDown',
                    label: 'Value (Asc)',
                    value: 'valueAsc',
                  },
                  {
                    iconName: 'bs/BsSortNumericUp',
                    label: 'Value (Desc)',
                    value: 'valueDesc',
                  },
                ]}
                onSelect={onChartHover}
              />
            </FormControl>
            <Divider />
          </>
        )}

        {isGroupedOutput && (
          <>
            <ToggleMenuItem
              key="defaultToZero"
              label="0 NA Values"
              value={defaultToZero}
              onClick={onToggleDefaultToZero}
            />
            <ToggleMenuItem
              key="showNA"
              label="NA Groupings"
              value={showNA}
              onClick={onToggleShowNA}
            />
            <Divider />
          </>
        )}

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
    </Stack>
  )
}

export default memo(ChartMenu)
