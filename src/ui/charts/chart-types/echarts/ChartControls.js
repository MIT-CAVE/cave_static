import {
  Box,
  FormControlLabel,
  Select,
  MenuItem,
  Switch,
  Slider,
  Typography,
} from '@mui/material'
import { styled } from '@mui/system'
import { useDispatch } from 'react-redux'

import { mutateLocal } from '../../../../data/local'

const CustomSlider = styled(Slider)(() => ({
  '& .MuiSlider-valueLabel': {
    fontSize: '9px',
    padding: '2px 6px',
  },
}))

const SortControl = ({ xAxisOrder, path }) => {
  const dispatch = useDispatch()

  const handleOrderChange = (value) => {
    dispatch(
      mutateLocal({
        path: [...path, 'xAxisOrder'],
        value,
        sync: true,
      })
    )
  }

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
        value={xAxisOrder}
        onChange={(e) => handleOrderChange(e.target.value)}
        size="small"
        sx={{ height: 30 }}
      >
        <MenuItem value="default">Default</MenuItem>
        <MenuItem value="ascending">Ascending</MenuItem>
        <MenuItem value="descending">Descending</MenuItem>
      </Select>
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
