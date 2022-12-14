import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, formatNumber } from '../../utils'

const rootStyle = {
  p: 2,
  maxWidth: '8vw',
  overflow: 'hidden',
}

const KpiMap = ({
  title,
  value,
  icon,
  unit: deprecatUnit,
  numberFormat: numberFormatRaw = {},
  style,
  sx = [],
  ...props
}) => {
  const numberFormatDefault = useSelector(selectNumberFormat)
  const numberFormat = useMemo(
    () =>
      // NOTE: The `unit` prop is deprecated in favor of
      // `numberFormat.unit` and will be removed on 1.0.0
      R.pipe(
        R.mergeRight(numberFormatDefault),
        R.when(R.pipe(R.prop('unit'), R.isNil), R.assoc('unit', deprecatUnit))
      )(numberFormatRaw),
    [deprecatUnit, numberFormatDefault, numberFormatRaw]
  )
  return (
    <Paper elevation={10} sx={[rootStyle, style, ...forceArray(sx)]} {...props}>
      <Typography sx={{ pb: 1 }} variant="subtitle1">
        <OverflowText text={title} />
      </Typography>
      <Grid container spacing={1.5} alignItems="flex-start" wrap="nowrap">
        <Grid item xs>
          <FetchedIcon iconName={icon} />
        </Grid>
        <Grid item xs={10}>
          <OverflowText text={formatNumber(value, numberFormat)} />
        </Grid>
      </Grid>
    </Paper>
  )
}
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
