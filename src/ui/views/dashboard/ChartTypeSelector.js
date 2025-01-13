import { Grid2, Paper, Typography } from '@mui/material'
import * as R from 'ramda'

import { chartVariant } from '../../../utils/enums'

import { FetchedIcon } from '../../compound'

const styles = {
  displayIcon: {
    p: 1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    color: 'common.white',
    minWidth: '100px',
  },
}

const ChartTypeSelector = ({ value, onChange, chartOptions }) => {
  const selectedValue = value || chartVariant.BAR

  return (
    <Grid2 container spacing={1} justifyContent="center" alignItems="center">
      {R.map((chartType) => {
        const isSelected = selectedValue === chartType.value
        return (
          <Grid2 item key={chartType.label}>
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
          </Grid2>
        )
      }, chartOptions)}
    </Grid2>
  )
}

export default ChartTypeSelector
