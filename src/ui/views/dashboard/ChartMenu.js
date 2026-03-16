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
} from '@mui/material'
import { memo } from 'react'
import { FaRegChartBar } from 'react-icons/fa'
import {
  MdClose,
  MdFilterAlt,
  MdFullscreen,
  MdFullscreenExit,
  MdMoreVert,
  MdOutlineColorLens,
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
    top: '8px',
    right: 0,
    zIndex: 1,
  },
  btnGroupVert: {
    mx: 0.5,
    bgcolor: 'background.paper',
    borderRadius: 1,
    button: {
      p: 0.75,
      width: '42px',
      opacity: 0.8,
      ':hover': { opacity: 1 },
    },
    '&> :first-child button': {
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
    },
    '&> :last-child button': {
      borderBottomLeftRadius: '4px',
      borderBottomRightRadius: '4px',
    },
  },
}

const UNSORTABLE_HOVERED_CHARTS = [
  chartVariant.TABLE,
  chartVariant.OVERVIEW,
  chartVariant.TREEMAP,
  chartVariant.GAUGE,
]

const CHARTS_WITHOUT_COLOR_SUPPORT = [
  chartVariant.TABLE,
  chartVariant.HEATMAP, // TODO: Add color support once proper UI/UX is defined
]

const MainButtons = ({
  chartType,
  isGroupedOutput,
  numFilters,
  onOpenFilter,
  onOpenChartTools,
  onOpenColorChange,
  onOpenMenu,
}) => (
  <ButtonGroup
    variant="contained"
    orientation="vertical"
    sx={styles.btnGroupVert}
  >
    <TooltipButton
      title="Chart Tools"
      placement="bottom-start"
      onClick={onOpenChartTools}
    >
      <FaRegChartBar size={24} />
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
          <MdFilterAlt size={24} />
        </Badge>
      </TooltipButton>
    )}

    {isGroupedOutput && !CHARTS_WITHOUT_COLOR_SUPPORT.includes(chartType) && (
      <TooltipButton
        title="Change color"
        placement="bottom-start"
        onClick={onOpenColorChange}
      >
        <MdOutlineColorLens size={24} />
      </TooltipButton>
    )}

    <TooltipButton
      title="View more Actions"
      placement="bottom-start"
      onClick={onOpenMenu}
    >
      <MdMoreVert size={24} />
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

const BaseMenuItem = ({ ReactIcon, label, onClick }) => (
  <MenuItem {...{ onClick }}>
    <ReactIcon size={20} style={{ marginRight: '16px' }} />
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
  onOpenColorChange,
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
        !isMaximized && { p: 0.5 },
        !isMaximized && editLayoutMode && { top: '20px', right: '8px' },
      ]}
    >
      <MainButtons
        {...{
          isGroupedOutput,
          chartType,
          numFilters,
          onOpenFilter,
          onOpenChartTools,
          onOpenColorChange,
        }}
        onOpenMenu={handleOpenMenu}
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

        {!isMap &&
          !UNSORTABLE_HOVERED_CHARTS.includes(chartType) &&
            // An array is preferred since `Menu` throws a warning for fragment children
            [
              <Select
                key="chart-hover-control"
                size="small"
                id="chart-hover"
                labelId="chart-hover-label"
                label={'Chart Hover \u279D Sort By'}
                slotProps={{
                  formControl: {
                    sx: {
                      m: 1,
                      maxWidth: 'calc(100% - 16px)',
                    },
                  },
                }}
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
              />,
              <Divider key="chart-hover-divider" />,
            ]}

        {isGroupedOutput &&
          // An array is preferred since `Menu` throws a warning for fragment children
          [
            <ToggleMenuItem
              key="default-to-zero"
              label="0 NA Values"
              value={defaultToZero}
              onClick={onToggleDefaultToZero}
            />,
            <ToggleMenuItem
              key="show-na-values"
              label="NA Groupings"
              value={showNA}
              onClick={onToggleShowNA}
            />,
            <Divider key="grouped-output-divider" />,
          ]}

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
