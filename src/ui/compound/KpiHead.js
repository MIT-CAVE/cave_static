import { Divider, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { KPI_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: KPI_WIDTH,
    textAlign: 'center',
    px: 1,
  },
  rowRoot: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: 1,
    borderColor: 'grey.500',
    placeContent: 'center',
    minWidth: KPI_WIDTH,
    textAlign: 'center',
  },
  title: {
    px: 1,
    fontSize: '24px',
    whiteSpace: 'nowrap',
  },
}

const KpiHeadRow = ({ title, icon, style, sx = [], ...props }) => (
  <Grid
    sx={[styles.rowRoot, style, ...forceArray(sx)]}
    {...R.dissoc('mapKpi', props)}
  >
    <Grid container item spacing={0.5} flexWrap="nowrap">
      {icon && (
        <Grid item alignSelf="center">
          <FetchedIcon iconName={icon} size={24} />
        </Grid>
      )}
      <Grid item xs={11} display="flex" alignItems="center">
        <OverflowText text={title} sx={styles.title} />
      </Grid>
    </Grid>
  </Grid>
)
KpiHeadRow.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

const KpiHeadColumn = ({ title, icon, style, sx = [], ...props }) => (
  <Grid
    sx={[styles.root, style, ...forceArray(sx)]}
    {...R.dissoc('mapKpi', props)}
  >
    <Grid container item spacing={1} flexWrap="nowrap">
      {icon && (
        <Grid item alignSelf="center">
          <FetchedIcon iconName={icon} size={24} />
        </Grid>
      )}
      <Grid item xs={11}>
        <OverflowText text={title} sx={styles.title} />
      </Grid>
    </Grid>
    <Divider sx={{ mt: 2 }} />
  </Grid>
)
KpiHeadColumn.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export { KpiHeadColumn, KpiHeadRow }
