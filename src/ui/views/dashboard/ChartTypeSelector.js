import { Grid2 as Grid, Paper, Typography } from '@mui/material'
import * as R from 'ramda'

import { chartVariant } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

const styles = {
  displayIcon: {
    py: 1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
    color: 'common.white',
  },
}

const ChartTypeSelector = ({ value, onChange, chartOptions }) => {
  const selectedValue = value || chartVariant.BAR

  return (
    <Grid
      container
      spacing={1}
      justifyContent="center"
      alignItems="center"
      columns={10}
    >
      {R.map((chartType) => {
        const isSelected = selectedValue === chartType.value
        return (
          <Grid item key={chartType.label} size={1}>
            <Paper
              sx={[
                styles.displayIcon,
                {
                  bgcolor: isSelected ? 'primary.dark' : 'grey.800',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'grey.700',
                  },
                },
              ]}
              elevation={isSelected ? 3 : 1}
              onClick={() => onChange(chartType.value)}
            >
              <FetchedIcon iconName={chartType.iconName} />
              <Typography variant="caption" align="center">
                {chartType.label}
              </Typography>
            </Paper>
          </Grid>
        )
      }, chartOptions)}
    </Grid>
  )
}

export default ChartTypeSelector
