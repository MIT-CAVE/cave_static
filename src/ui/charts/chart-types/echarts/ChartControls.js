import {
  Box,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
} from '@mui/material'
import { styled } from '@mui/system'

import { useMutateStateWithSync } from '../../../../utils/hooks'

import { Select } from '../../../compound'

const CustomSlider = styled(Slider)(() => ({
  '& .MuiSlider-valueLabel': {
    fontSize: '9px',
    padding: '2px 6px',
  },
}))

const styles = {
  sortItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  select: {
    height: 30,
    width: 140,
    '& .MuiSelect-select': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
    },
  },
}

const SortControl = ({ xAxisOrder, path }) => {
  const validOrders = [
    'default',
    'value_ascending',
    'value_descending',
    'alpha_ascending',
    'alpha_descending',
  ]
  const currentOrder = validOrders.includes(xAxisOrder) ? xAxisOrder : 'default'

  const handleSelectOrder = useMutateStateWithSync(
    (value) => ({ path: [...path, 'xAxisOrder'], value }),
    [path]
  )

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography sx={{ whiteSpace: 'nowrap' }}>Sort By</Typography>
      <Select
        value={currentOrder}
        onSelect={handleSelectOrder}
        size="small"
        iconSize="22px"
        sx={styles.select}
        optionsList={[
          {
            iconName: 'fa/FaSort',
            label: 'Default',
            value: 'default',
          },
          {
            iconName: 'bs/BsSortAlphaDown',
            label: 'Name (Asc)',
            value: 'alpha_ascending',
          },
          {
            iconName: 'bs/BsSortAlphaUp',
            label: 'Name (Desc)',
            value: 'alpha_descending',
          },
          {
            iconName: 'bs/BsSortNumericDown',
            label: 'Value (Asc)',
            value: 'value_ascending',
          },
          {
            iconName: 'bs/BsSortNumericUp',
            label: 'Value (Desc)',
            value: 'value_descending',
          },
        ]}
      />
    </Box>
  )
}

const SyncAxesControl = ({ syncAxes, onSyncAxesChange }) => (
  <FormControlLabel
    control={
      <Switch
        checked={syncAxes}
        onChange={(e) => onSyncAxesChange(e.target.checked)}
      />
    }
    label="Sync Axes?"
    labelPlacement="start"
  />
)

const BucketsControl = ({ numBuckets, onNumBucketsChange }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      minWidth: 300,
    }}
  >
    <Typography sx={{ whiteSpace: 'nowrap' }}>Number of Buckets</Typography>
    <CustomSlider
      value={numBuckets}
      onChange={(e) => onNumBucketsChange(e.target.value)}
      min={2}
      max={20}
      valueLabelDisplay="auto"
      size="small"
    />
  </Box>
)

const ChartControls = ({
  path,
  xAxisOrder,
  syncAxes,
  onSyncAxesChange,
  numBuckets,
  onNumBucketsChange,
}) => {
  const showSort = path && xAxisOrder !== undefined
  const showSync = syncAxes !== undefined && onSyncAxesChange
  const showBuckets = numBuckets !== undefined && onNumBucketsChange

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 20,
        bottom: 5,
        display: 'flex',
        flexDirection: 'row-reverse',
        gap: 2,
      }}
    >
      {showSort && <SortControl {...{ xAxisOrder, path }} />}
      {showSync && <SyncAxesControl {...{ syncAxes, onSyncAxesChange }} />}
      {showBuckets && (
        <BucketsControl {...{ numBuckets, onNumBucketsChange }} />
      )}
    </Box>
  )
}

export default ChartControls
