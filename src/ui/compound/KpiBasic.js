import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import FetchedIcon from './FetchedIcon'
import { OverflowText } from './OverflowText'

import { KPI_WIDTH } from '../../utils/constants'

import { forceArray, prettifyValue } from '../../utils'

const styles = {
  root: {
    position: 'relative',
    minWidth: KPI_WIDTH,
    p: 3,
  },
  title: {
    pl: 1,
    pr: 1,
    fontSize: '24px',
    whiteSpace: 'nowrap',
  },
  value: {
    fontSize: '16px',
    fontWeight: (theme) => theme.typography.fontWeightBold,
    letterSpacing: '0.03em',
  },
}

const KpiBasic = ({ title, value, icon, unit, style, sx = [], ...props }) => (
  <Paper elevation={2} sx={[styles.root, style, ...forceArray(sx)]} {...props}>
    <Grid container flexDirection="column" spacing={3}>
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
      <Grid item xs>
        {value && (
          <Typography sx={styles.value}>{`${prettifyValue(value)} ${
            unit || 'units'
          }`}</Typography>
        )}
      </Grid>
    </Grid>
  </Paper>
)
KpiBasic.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
  icon: PropTypes.string,
  unit: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default KpiBasic
