import { Grid } from '@mui/material'

import OverflowText from './OverflowText'

const GradientBox = ({ maxColor, minColor, maxLabel, minLabel }) => (
  <Grid item container xs justifyContent="space-between" alignItems="center">
    <Grid
      zeroMinWidth
      sx={{
        mx: 1,
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      <OverflowText text={minLabel} />
    </Grid>
    <Grid
      xs
      height="18px"
      minWidth="60px"
      sx={{
        my: 2,
        backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
      }}
    />
    <Grid
      zeroMinWidth
      sx={{
        mx: 1,
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      <OverflowText text={maxLabel} />
    </Grid>
  </Grid>
)

export default GradientBox
