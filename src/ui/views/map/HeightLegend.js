import {
  FormControl,
  Grid2,
  InputLabel,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useSelector } from 'react-redux'

import { selectNumberFormatPropsFn } from '../../../data/selectors'
import { propId } from '../../../utils/enums'

import { OverflowText, Select } from '../../compound'

const styles = {
  unit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    border: 1,
    px: 1,
    borderColor: 'rgb(128, 128, 128)',
    boxSizing: 'border-box',
  },
}

const HeightLegend = ({
  valueRange,
  heightBy,
  heightByOptions,
  featureTypeProps,
  icon,
  onSelectProp,
}) => {
  const getNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  const heightByProp = featureTypeProps[heightBy]
  const numberFormat = getNumberFormatProps(heightByProp)
  const isCategorical = heightByProp.type !== propId.NUMBER

  const renderNumericHeight = () => {
    return (
      <Grid2 container spacing={1}>
        <Grid2 size={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Min
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.min}
          </Typography>
        </Grid2>

        <Grid2 size={6} container alignItems="center" justifyContent="center">
          <Grid2 container size={6} alignItems="center" justifyContent="center">
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  height: `${valueRange.min}px`,
                  width: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  transform: 'rotate(90deg)',
                }}
              />
            )}
          </Grid2>
          <Grid2 container size={6} alignItems="center" justifyContent="center">
            {icon && (
              <icon.type
                {...icon.props}
                style={{
                  height: `${valueRange.max}px`,
                  width: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  transform: 'rotate(90deg)',
                }}
              />
            )}
          </Grid2>
        </Grid2>

        <Grid2 size={3} sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'normal' }}>
            Max
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {valueRange.max}
          </Typography>
        </Grid2>
      </Grid2>
    )
  }

  const renderCategoricalHeight = () => (
    <Stack direction="row" spacing={1.5} justifyContent="center">
      {Object.entries(heightByOptions).map(([category]) => (
        <Paper key={category} sx={{ padding: 0.5, textAlign: 'center' }}>
          <Typography variant="caption">{category}</Typography>
        </Paper>
      ))}
    </Stack>
  )

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Grid2 container spacing={1}>
        <Grid2 size="grow">
          <FormControl fullWidth>
            <InputLabel id="height-by-label">Height by</InputLabel>
            <Select
              id="height-by"
              labelId="height-by-label"
              label="Height by"
              value={heightBy}
              optionsList={Object.keys(heightByOptions)}
              getLabel={(option) => featureTypeProps[option].name || option}
              onSelect={onSelectProp}
            />
          </FormControl>
        </Grid2>
        {numberFormat.unit && (
          <Grid2 size={4}>
            <Typography variant="subtitle1" sx={styles.unit}>
              <OverflowText text={numberFormat.unit} />
            </Typography>
          </Grid2>
        )}
      </Grid2>

      {isCategorical ? renderCategoricalHeight() : renderNumericHeight()}
    </Stack>
  )
}

export default HeightLegend
