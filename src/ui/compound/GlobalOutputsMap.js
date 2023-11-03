import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { NumberFormat, forceArray } from '../../utils'

const rootStyle = {
  p: 2,
  maxWidth: '8vw',
  overflow: 'hidden',
}

const GlobalOutputMap = ({
  title,
  value,
  icon,
  style,
  sx = [],
  mapGlobalOutput = true,
  ...props
}) => {
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(props)
  if (mapGlobalOutput) {
    return (
      <Paper elevation={10} sx={[rootStyle, style, ...forceArray(sx)]}>
        <Typography sx={{ pb: 1 }} variant="subtitle1">
          <OverflowText text={title} />
        </Typography>
        <Grid container spacing={1.5} alignItems="flex-start" wrap="nowrap">
          <Grid item xs>
            <FetchedIcon iconName={icon} />
          </Grid>
          <Grid item xs={10}>
            <OverflowText
              text={NumberFormat.format(value, numberFormatProps)}
            />
          </Grid>
        </Grid>
      </Paper>
    )
  } else {
    return null
  }
}
GlobalOutputMap.propTypes = {
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
  mapGlobalOutput: PropTypes.bool,
}

export default GlobalOutputMap
