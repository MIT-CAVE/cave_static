import { Badge, Box, IconButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { FaChartBar, FaFilter } from 'react-icons/fa'
import { useSelector } from 'react-redux'

import { selectDashboardLockedLayout } from '../../../data/selectors'

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'nowrap',
    pb: 0.75,
    width: (theme) => `calc(100% - ${theme.spacing(6)})`,
    margin: 0.5,
  },
  filter: {
    mr: 0.5,
    ml: 'auto',
    alignSelf: 'center',
  },
}

const ChartToolbar = ({
  chartObj,
  numFilters,
  showFilter,
  onOpenFilter,
  onOpenChartTools,
}) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)

  return (
    <Box
      sx={[
        styles.root,
        (lockedLayout || chartObj.lockedLayout) && {
          width: '100%',
          '>:last-child': { mr: 0 },
        },
      ]}
    >
      <IconButton sx={styles.filter} onClick={onOpenChartTools}>
        <Badge
          {...{
            color: 'info',
            badgeContent: numFilters,
            invisible: numFilters < 1,
          }}
        >
          <FaChartBar />
        </Badge>
      </IconButton>
      {showFilter && (
        <IconButton sx={styles.filter} onClick={onOpenFilter}>
          <Badge
            {...{
              color: 'info',
              badgeContent: numFilters,
              invisible: numFilters < 1,
            }}
          >
            <FaFilter />
          </Badge>
        </IconButton>
      )}
    </Box>
  )
}

export default memo(ChartToolbar, R.equals)
