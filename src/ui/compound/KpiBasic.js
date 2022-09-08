import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormat } from '../../data/selectors'
import { KPI_WIDTH } from '../../utils/constants'

import { forceArray, formatNumber } from '../../utils'

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

const KpiBasic = ({
  title,
  value,
  icon,
  style,
  unit: deprecatUnit,
  numberFormat: numberFormatRaw = {},
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
    <Paper
      elevation={2}
      sx={[styles.root, style, ...forceArray(sx)]}
      {...props}
    >
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
            <Typography sx={styles.value}>
              {formatNumber(value, numberFormat)}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
KpiBasic.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
  icon: PropTypes.string,
  style: PropTypes.object,
  unit: PropTypes.string,
  numberFormat: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default KpiBasic
