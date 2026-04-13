import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import { IconButton, Stack } from '@mui/material'
import {
  MdAdd,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdRemove,
} from 'react-icons/md'

import { forceArray } from '../../utils'

const styles = {
  spinner: {
    height: '100%',
  },
  button: {
    height: '100%',
    py: 0,
    px: 1,
    flex: 1,
    borderRadius: 0.5,
  },
}

export const SpinnerIncreaseButton = ({
  icon: SpinnerIcon = MdAdd,
  color = 'default',
  size = 'small',
  sx = [],
}) => (
  <BaseNumberField.Increment
    render={
      <IconButton
        aria-label="Increase"
        {...{ color, size }}
        sx={[styles.button, ...forceArray(sx)]}
      />
    }
  >
    <SpinnerIcon />
  </BaseNumberField.Increment>
)

export const SpinnerDecreaseButton = ({
  icon: SpinnerIcon = MdRemove,
  color = 'default',
  size = 'small',
  sx = [],
}) => (
  <BaseNumberField.Decrement
    render={
      <IconButton
        aria-label="Decrease"
        {...{ color, size }}
        sx={[styles.button, ...forceArray(sx)]}
      />
    }
  >
    <SpinnerIcon />
  </BaseNumberField.Decrement>
)

const Spinner = ({
  side,
  decreaseIcon = MdKeyboardArrowDown,
  increaseIcon = MdKeyboardArrowUp,
}) => (
  <Stack
    sx={[
      styles.spinner,
      side === 'right' && {
        // borderLeft: '1px solid',
        // borderColor: 'divider',
        boxShadow: 'inset 1px 0 0 rgb(255 255 255 / .12)',
      },
      side === 'left' && {
        // borderRight: '1px solid',
        // borderColor: 'divider',
        boxShadow: 'inset -1px 0 0 rgb(255 255 255 / .12)',
      },
    ]}
  >
    <SpinnerIncreaseButton icon={increaseIcon} />
    <SpinnerDecreaseButton icon={decreaseIcon} />
  </Stack>
)

export default Spinner
