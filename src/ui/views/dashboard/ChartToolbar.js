import { Badge, Grid, IconButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { FaFilter } from 'react-icons/fa'
import { useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'
import GlobalOutputsToolbar from './GlobalOutputsToolbar'
import GroupedOutputsToolbar from './GroupedOutputsToolbar'
import MapToolbar from './MapToolbar'

import {
  selectDashboardLockedLayout,
  selectSync,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'
import { useMutateState } from '../../../utils/hooks'

import { Select } from '../../compound'

import { includesPath } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'nowrap',
    pb: 0.75,
    width: (theme) => `calc(100% - ${theme.spacing(6)})`,
  },
  filter: {
    mr: 0.5,
    ml: 'auto',
    alignSelf: 'center',
  },
}

const ChartToolbar = ({
  chartObj,
  index,
  path,
  numFilters,
  showFilter,
  onOpenFilter,
}) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const sync = useSelector(selectSync)

  const handleSelectVizType = useMutateState(
    (value) => ({
      path,
      value: R.pipe(
        R.assoc('type', value),
        // If the new selected `vizType` doesn't support the current
        // chart variant chosen, switch to a 'table' variant.
        R.when(
          R.either(
            R.both(
              R.always(value === 'groupedOutput'),
              R.propEq(chartVariant.OVERVIEW, 'variant')
            ),
            R.both(
              R.always(value === 'globalOutput'),
              R.pipe(
                R.prop('variant'),
                R.flip(R.includes)([
                  chartVariant.BAR,
                  chartVariant.LINE,
                  chartVariant.TABLE,
                ]),
                R.not
              )
            )
          ),
          R.assoc('variant', chartVariant.TABLE)
        )
      )(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [sync, chartObj, path]
  )

  return (
    <Grid
      sx={[
        styles.root,
        (lockedLayout || chartObj.lockedLayout) && {
          width: '100%',
          '>:last-child': { mr: 0 },
        },
      ]}
    >
      <ChartDropdownWrapper
        sx={{ ml: 0 }}
        menuProps={{
          transformOrigin: { horizontal: 'left', vertical: 'top' },
          anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
        }}
      >
        <Select
          value={R.propOr('groupedOutput', 'type')(chartObj)}
          optionsList={[
            {
              label: 'Grouped Outputs',
              value: 'groupedOutput',
              iconName: 'md/MdMultilineChart',
            },
            {
              label: 'Global Outputs',
              value: 'globalOutput',
              iconName: 'md/MdSpeed',
            },
            {
              label: 'Maps',
              value: 'map',
              iconName: 'fa/FaMapMarked',
            },
          ]}
          onSelect={handleSelectVizType}
        />
      </ChartDropdownWrapper>

      {R.propOr('groupedOutput', 'type', chartObj) === 'groupedOutput' ? (
        <GroupedOutputsToolbar {...{ chartObj, index }} />
      ) : chartObj.type === 'globalOutput' ? (
        <GlobalOutputsToolbar {...{ chartObj, index }} />
      ) : (
        <MapToolbar {...{ chartObj, index }} />
      )}
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
    </Grid>
  )
}

export default memo(ChartToolbar, R.equals)
