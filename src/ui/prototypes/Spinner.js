import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import { IconButton, Stack } from '@mui/material'
// import { useCallback, useEffect, useRef } from 'react'
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

// const START_DELAY = 400
// const TICK_DELAY = 75

// const SpinnerButtonAlt = ({ onChange, onChangeCommitted, children }) => {
//   const timeoutRef = useRef(null)
//   const intervalRef = useRef(null)

//   const handleStart = useCallback(
//     (event) => {
//       event.preventDefault()
//       onChange(event)

//       // let interval = 150 // Call this first when acceleration is implemented

//       // Set a delay before continuous firing
//       timeoutRef.current = setTimeout(() => {
//         intervalRef.current = setInterval(() => {
//           onChange(event)
//         }, TICK_DELAY)

//         // // TODO: Implement acceleration
//         // intervalRef.current = setInterval(() => {
//         //   onStep()
//         //   interval = Math.max(MIN_ACCELERATION ?? 40, interval * 0.85)
//         //   clearInterval(intervalRef.current)
//         //   intervalRef.current = setInterval(onStep, interval)
//         // }, interval)
//       }, START_DELAY)
//     },
//     [onChange]
//   )

//   const handleStop = useCallback(() => {
//     clearTimeout(timeoutRef.current)
//     clearInterval(intervalRef.current)
//     timeoutRef.current = null
//     intervalRef.current = null
//     onChangeCommitted()
//   }, [onChangeCommitted])

//   useEffect(() => {
//     window.addEventListener('pointerup', handleStop)
//     return () => window.removeEventListener('pointerup', handleStop)
//   }, [handleStop])

//   return (
//     <IconButton
//       onPointerDown={handleStart}
//       onPointerUp={handleStop}
//       onPointerLeave={handleStop}
//     >
//       {children}
//     </IconButton>
//   )
// }

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
        borderLeft: '1px solid',
        borderColor: 'divider',
        // boxShadow: 'inset 1px 0 0 rgb(255 255 255 / .12)',
      },
      side === 'left' && {
        borderRight: '1px solid',
        borderColor: 'divider',
        // boxShadow: 'inset -1px 0 0 rgb(255 255 255 / .12)',
      },
    ]}
  >
    <SpinnerIncreaseButton icon={increaseIcon} />
    <SpinnerDecreaseButton icon={decreaseIcon} />
  </Stack>
)

export default Spinner
