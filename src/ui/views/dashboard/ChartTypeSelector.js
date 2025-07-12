import {
  Divider,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import * as R from 'ramda'

import { chartVariant } from '../../../utils/enums'

import { FetchedIcon, OverflowText } from '../../compound'

// const styles = {
//   displayIcon: {
//     py: 1,
//     cursor: 'pointer',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 1,
//     color: 'common.white',
//   },
// }

const ChartTypeSelector = ({ value, onChange, chartOptions, extraOptions }) => {
  const selectedValue = value || chartVariant.BAR
  const handleChange = (event, newValue) => {
    if (newValue == null) return
    onChange(newValue)
  }
  return (
    <>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={selectedValue}
        onChange={handleChange}
      >
        <Grid
          container
          sx={{ width: '100%', alignItems: 'stretch', justifyContent: 'start' }}
          spacing={1}
          columns={9}
        >
          {R.map((chartType) => {
            const isSelected = selectedValue === chartType.value
            return (
              <Grid key={chartType.label} size={1}>
                <ToggleButton
                  color="primary"
                  value={chartType.value}
                  selected={isSelected}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <FetchedIcon iconName={chartType.iconName} size={24} />
                  <Typography
                    noWrap
                    variant="caption"
                    sx={{
                      maxWidth: '100%',
                      textTransform: 'initial',
                    }}
                  >
                    <OverflowText text={chartType.label} />
                  </Typography>
                </ToggleButton>
              </Grid>
            )
          }, chartOptions)}
          {extraOptions}
        </Grid>
      </ToggleButtonGroup>
      <Divider flexItem />
    </>
  )
}

export default ChartTypeSelector
