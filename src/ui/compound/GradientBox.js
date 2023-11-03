import { Grid } from '@mui/material'
import * as R from 'ramda'
import { BlockPicker } from 'react-color'
import { useDispatch, useSelector } from 'react-redux'

import OverflowText from './OverflowText'
import StableTooltip from './StableTooltip'

import { mutateLocal } from '../../data/local'
import { selectSync } from '../../data/selectors'

import { includesPath } from '../../utils'

const GradientBox = ({
  maxColor,
  minColor,
  maxLabel,
  minLabel,
  colorPropPath,
}) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const getTitle = (endKey, color) => (
    <BlockPicker
      color={color}
      triangle="hide"
      onChangeComplete={(color) => {
        const path = R.concat(colorPropPath, [endKey])
        console.log({ path, color })
        return dispatch(
          mutateLocal({
            path: path,
            sync: !includesPath(R.values(sync), path),
            value: `rgba(${color.rgb.r},${color.rgb.g},${color.rgb.b},${
              color.rgb.a * 255
            })`,
          })
        )
      }}
    />
  )
  return (
    <Grid item container xs justifyContent="space-between" alignItems="center">
      <StableTooltip title={getTitle('startGradientColor', minColor)}>
        <Grid
          item
          zeroMinWidth
          sx={{
            mx: 1,
            fontWeight: 700,
            textAlign: 'center',
            padding: '8% 32% 8% 2%',
            margin: '-8% -30% -8% 0',
          }}
        >
          <OverflowText text={minLabel} />
        </Grid>
      </StableTooltip>
      <Grid
        item
        xs
        height="18px"
        minWidth="60px"
        sx={{
          my: 2,
          backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
        }}
      />
      <StableTooltip title={getTitle('endGradientColor', maxColor)}>
        <Grid
          item
          zeroMinWidth
          sx={{
            mx: 1,
            fontWeight: 700,
            textAlign: 'center',
            padding: '8% 2% 8% 32%',
            margin: '-8% 0 -8% -30%',
          }}
        >
          <OverflowText text={maxLabel} />
        </Grid>
      </StableTooltip>
    </Grid>
  )
}

export default GradientBox
