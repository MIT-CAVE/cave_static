import { Box, Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'
import {
  MdBookmarkAdded,
  MdBookmarkBorder,
  MdBookmarkRemove,
  MdOutlineBookmarkAdd,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { mapKpiToggle } from '../../data/local/kpisSlice'
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
    px: 1,
    fontSize: '24px',
    whiteSpace: 'nowrap',
  },
  value: {
    fontSize: '16px',
    fontWeight: (theme) => theme.typography.fontWeightBold,
    letterSpacing: '0.03em',
  },
  kpiToggleIcon: (theme) => ({
    position: 'absolute',
    fontSize: 26,
    top: theme.spacing(1),
    right: theme.spacing(1),
    // color: 'primary.main',
    cursor: 'pointer',
  }),
}

const KpiToggleIcon = ({ kpiId, mapKpi }) => {
  const [hover, setHover] = useState(false)
  const dispatch = useDispatch()
  return (
    <Box
      sx={[styles.kpiToggleIcon, { opacity: mapKpi || hover ? 1 : 0.2 }]}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => dispatch(mapKpiToggle(kpiId))}
    >
      {R.cond([
        [R.and(hover), R.always(<MdBookmarkRemove />)],
        [R.and(!hover), R.always(<MdBookmarkAdded />)],
        [R.or(hover), R.always(<MdOutlineBookmarkAdd />)],
        [R.T, R.always(<MdBookmarkBorder />)],
      ])(mapKpi)}
    </Box>
  )
}

const KpiBasic = ({
  id,
  title,
  value,
  icon,
  style,
  mapKpi,
  numberFormat: numberFormatRaw = {},
  sx = [],
  ...props
}) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const numberFormat = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Paper
      elevation={2}
      sx={[styles.root, style, ...forceArray(sx)]}
      {...props}
    >
      <KpiToggleIcon {...{ kpiId: id, mapKpi }} />
      <Grid container flexDirection="column" spacing={3}>
        <Grid container item spacing={1} flexWrap="nowrap">
          {icon && (
            <Grid item alignSelf="center">
              <FetchedIcon iconName={icon} size={24} />
            </Grid>
          )}
          <Grid item xs={10.5}>
            <OverflowText text={title} sx={styles.title} />
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
