import * as R from 'ramda'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  timeSelection,
  timeSetStart,
  timeAdvanceContinuous,
  timePause,
} from '../../../data/local/settingsSlice'
import {
  selectCurrentTime,
  selectCurrentTimeLength,
  selectCurrentTimeUnits,
  selectAnimationInterval,
  selectCurrentLooping,
  selectCurrentSpeed,
  selectSync,
} from '../../../data/selectors'
import { updateAnimation } from '../../../data/utilities/timeSlice'
import { useMutateState } from '../../../utils/hooks'

import { includesPath } from '../../../utils'

export const TIME_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
]

// A trimmed-down set of the most common speeds, for compact toggle-button
// UIs where showing all of `TIME_SPEED_OPTIONS` would take too much space.
export const TIME_SPEED_SHORTCUTS = [
  { value: 0.5, label: '.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
]

export const useTimeControl = () => {
  const playbackSpeed = useSelector(selectCurrentSpeed)
  const looping = useSelector(selectCurrentLooping)

  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const animationInterval = useSelector(selectAnimationInterval)
  const dispatch = useDispatch()

  const playbackSpeedRef = useRef(playbackSpeed)

  const animation = R.is(Number, animationInterval)
  const sync = useSelector(selectSync)

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed
  }, [playbackSpeed])

  const handleChangeLooping = useMutateState(
    () => ({
      path: ['settings', 'time', 'looping'],
      value: !looping,
      sync: !includesPath(R.values(sync), ['settings', 'time', 'looping']),
    }),
    [looping, sync]
  )

  const updatePlaybackSpeed = useMutateState(
    (newPlaybackSpeed) => ({
      path: ['settings', 'time', 'speed'],
      value: newPlaybackSpeed,
      sync: !includesPath(R.values(sync), ['settings', 'time', 'speed']),
    }),
    [sync]
  )

  const advanceContinuous = useCallback(() => {
    dispatch(timeAdvanceContinuous(playbackSpeedRef.current))
  }, [dispatch, playbackSpeedRef])

  useEffect(() => {
    if (!looping && currentTime === timeLength) {
      clearInterval(animationInterval)
      dispatch(updateAnimation(false))
    } else if (looping && currentTime === timeLength + 1) {
      dispatch(timeSelection(0))
    }
  }, [currentTime, looping, timeLength, animationInterval, dispatch])

  const toggleAnimationSpeed = useCallback(() => {
    clearInterval(animationInterval)
    const newAnimationInterval = setInterval(advanceContinuous, 1)
    dispatch(updateAnimation(newAnimationInterval))
  }, [advanceContinuous, animationInterval, dispatch])

  const setPlaybackSpeed = useCallback(
    (newPlaybackSpeed) => {
      updatePlaybackSpeed(newPlaybackSpeed)
      if (animation) {
        toggleAnimationSpeed()
      }
    },
    [animation, toggleAnimationSpeed, updatePlaybackSpeed]
  )

  const setTime = useCallback(
    (newTime) => {
      dispatch(timeSelection(newTime))
    },
    [dispatch]
  )

  const handlePlay = useCallback(() => {
    dispatch(timeSetStart())
    toggleAnimationSpeed()
  }, [dispatch, toggleAnimationSpeed])

  const handlePause = useCallback(() => {
    dispatch(timePause())
    clearInterval(animationInterval)
    dispatch(updateAnimation(false))
  }, [animationInterval, dispatch])

  return {
    currentTime,
    timeLength,
    timeUnits,
    animation,
    looping,
    playbackSpeed,
    setTime,
    handlePlay,
    handlePause,
    setPlaybackSpeed,
    handleChangeLooping,
  }
}
