import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { NumberFormat, forceArray } from '../../utils'

const styles = {
  root: {
    p: 2,
    maxWidth: '10vw',
    overflow: 'hidden',
  },
  name: {
    pb: 1,
    color: 'text.secondary',
  },
  value: {
    fontWeight: (theme) => theme.typography.fontWeightBold,
  },
}

const PropNumberIconCompact = ({ prop, sx = [] }) => {
  const { name, value, icon, style } = prop
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  return (
    <Paper elevation={10} sx={[styles.root, style, ...forceArray(sx)]}>
      <Typography sx={styles.name} variant="subtitle1">
        <OverflowText text={name} />
      </Typography>
      <Grid container spacing={1.5} alignItems="flex-start" wrap="nowrap">
        <Grid size="grow">
          <FetchedIcon iconName={icon} />
        </Grid>
        <Grid size={10}>
          <OverflowText
            sx={styles.value}
            text={NumberFormat.format(value, numberFormatProps)}
          />
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
