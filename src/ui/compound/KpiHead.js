import { Divider, Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'

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
  title: {
    px: 1,
    fontSize: '24px',
    whiteSpace: 'nowrap',
  },
}

const KpiHead = ({ title, icon, style, sx = [], ...props }) => (
  <Grid sx={[styles.root, style, ...forceArray(sx)]} {...props}>
    <Grid container item spacing={1} flexWrap="nowrap">
      {icon && (
        <Grid item alignSelf="center">
          <FetchedIcon iconName={icon} size={24} />
        </Grid>
      )}
      <Grid item xs={11}>
        <Typography sx={styles.title}>
          <OverflowText text={title} />
        </Typography>
      </Grid>
    </Grid>
    <Divider sx={{ mt: 2 }} />
  </Grid>
)
KpiHead.propTypes = {
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

export default KpiHead
