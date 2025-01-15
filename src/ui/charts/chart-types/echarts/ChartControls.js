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
import {
  FaSort,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortNumericDown,
  FaSortNumericUp,
} from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import { mutateLocal } from '../../../../data/local'

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
  iconSize: 20,
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
  const dispatch = useDispatch()
  const validOrders = [
    'default',
    'value_ascending',
    'value_descending',
    'alpha_ascending',
    'alpha_descending',
  ]
  const currentOrder = validOrders.includes(xAxisOrder) ? xAxisOrder : 'default'

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
        value={currentOrder}
        onChange={(e) => handleOrderChange(e.target.value)}
        size="small"
        sx={styles.select}
      >
        <MenuItem value="default" sx={styles.sortItem}>
          <FaSort fontSize={styles.iconSize} /> Default
        </MenuItem>
        <MenuItem value="value_ascending" sx={styles.sortItem}>
          <FaSortNumericUp fontSize={styles.iconSize} /> Value
        </MenuItem>
        <MenuItem value="value_descending" sx={styles.sortItem}>
          <FaSortNumericDown fontSize={styles.iconSize} /> Value
        </MenuItem>
        <MenuItem value="alpha_ascending" sx={styles.sortItem}>
          <FaSortAlphaUp fontSize={styles.iconSize} /> Name
        </MenuItem>
        <MenuItem value="alpha_descending" sx={styles.sortItem}>
          <FaSortAlphaDown fontSize={styles.iconSize} /> Name
        </MenuItem>
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
