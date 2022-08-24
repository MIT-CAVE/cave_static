import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { forceArray, prettifyValue } from '../../utils'

const rootStyle = {
  p: 2,
  maxWidth: '8vw',
  overflow: 'hidden',
}

const KpiMap = ({ title, value, icon, unit, style, sx = [], ...props }) => (
  <Paper elevation={10} sx={[rootStyle, style, ...forceArray(sx)]} {...props}>
    <Typography sx={{ pb: 1 }} variant="subtitle1">
      <OverflowText text={title} />
    </Typography>
    <Grid container spacing={1.5} alignItems="flex-start" wrap="nowrap">
      <Grid item xs>
        <FetchedIcon iconName={icon} />
      </Grid>
      <Grid item xs={10}>
        <OverflowText text={`${prettifyValue(value)} ${unit}`} />
      </Grid>
    </Grid>
  </Paper>
)
KpiMap.propTypes = {
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

export default KpiMap
