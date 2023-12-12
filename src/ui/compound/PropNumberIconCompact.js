import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { NumberFormat, forceArray } from '../../utils'

const rootStyle = {
  p: 2,
  maxWidth: '10vw',
  overflow: 'hidden',
}

const PropNumberIconCompact = ({ prop, sx = [] }) => {
  const { name, value, icon, style } = prop
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  return (
    <Paper elevation={10} sx={[rootStyle, style, ...forceArray(sx)]}>
      <Typography sx={{ pb: 1 }} variant="subtitle1">
        <OverflowText text={name} />
      </Typography>
      <Grid container spacing={1.5} alignItems="flex-start" wrap="nowrap">
        <Grid item xs>
          <FetchedIcon iconName={icon} />
        </Grid>
        <Grid item xs={10}>
          <OverflowText text={NumberFormat.format(value, numberFormatProps)} />
        </Grid>
      </Grid>
    </Paper>
  )
}
PropNumberIconCompact.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
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

export default PropNumberIconCompact
