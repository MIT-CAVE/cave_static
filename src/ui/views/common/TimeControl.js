import { FormControl, Box, ToggleButton, Slider, Stack } from '@mui/material'
import * as R from 'ramda'
import { useEffect, useCallback } from 'react'
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayCircle,
  MdPauseCircle,
  MdSkipPrevious,
  MdSkipNext,
  MdOutlineCached,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { timeSelection, timeAdvance } from '../../../data/local/settingsSlice'
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
import Select from '../../compound/Select'
import TooltipButton from '../../compound/TooltipButton'

import { includesPath } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.paper',
  },
  slider: {
    mt: 4,
    ml: 2,
    width: 'calc(100% - 16px - 40px)',
  },
  animControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    py: 0.5,
    pl: 0.5,
  },
  animRightCtrls: {
    display: 'flex',
    pr: 1.5,
  },
}

const TimeControl = () => {
  const playbackSpeed = useSelector(selectCurrentSpeed)
  const looping = useSelector(selectCurrentLooping)

  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const animationInterval = useSelector(selectAnimationInterval)
  const dispatch = useDispatch()

  const animation = R.is(Number, animationInterval)
  const sync = useSelector(selectSync)

  const toggleLooping = useMutateState(
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

  const advanceAnimation = useCallback(() => {
    dispatch(timeAdvance(timeLength))
  }, [dispatch, timeLength])

  useEffect(() => {
    if (!looping && currentTime + 1 === timeLength) {
      clearInterval(animationInterval)
      dispatch(updateAnimation(false))
    }
  }, [currentTime, looping, timeLength, animationInterval, dispatch])

  const toggleAnimationSpeed = useCallback(
    (newPlaybackSpeed) => {
      clearInterval(animationInterval)
      const newAnimationInterval = setInterval(
        advanceAnimation,
        1000 / newPlaybackSpeed
      )
      dispatch(updateAnimation(newAnimationInterval))
    },
    [advanceAnimation, animationInterval, dispatch]
  )

  return (
    <Stack sx={styles.root}>
      <Slider
        onMouseDown={(event) => {
          event.stopPropagation()
        }}
        sx={styles.slider}
        aria-label="time slider"
        valueLabelDisplay="on"
        marks
        max={timeLength}
        min={1}
        step={1}
        value={currentTime + 1}
        onChange={(e, newValue) => {
          dispatch(timeSelection(newValue - 1))
        }}
      />
      <Box sx={styles.animControls}>
        <TooltipButton
          title="Go back to start"
          placement="bottom"
          disabled={currentTime === 0}
          onClick={() => {
            dispatch(timeSelection(0))
          }}
        >
          <MdSkipPrevious />
        </TooltipButton>
        <TooltipButton
          title={`Reduce time by one ${timeUnits}`}
          placement="bottom"
          disabled={currentTime === 0}
          onClick={() => {
            const newTime = currentTime - 1
            if (newTime >= 0) {
              dispatch(timeSelection(newTime))
            }
          }}
        >
          <MdNavigateBefore />
        </TooltipButton>

        {animation ? (
          <TooltipButton
            title="Pause animation"
            placement="bottom"
            onClick={() => {
              clearInterval(animationInterval)
              dispatch(updateAnimation(false))
            }}
          >
            <MdPauseCircle size={40} />
          </TooltipButton>
        ) : (
          <TooltipButton
            title="Play animation"
            placement="bottom"
            onClick={() => {
              toggleAnimationSpeed(playbackSpeed)
            }}
          >
            <MdPlayCircle size={40} />
          </TooltipButton>
        )}
        <TooltipButton
          title={`Advance time by one ${timeUnits}`}
          placement="bottom"
          disabled={currentTime === timeLength - 1}
          onClick={advanceAnimation}
        >
          <MdNavigateNext />
        </TooltipButton>
        <TooltipButton
          title="Go to end"
          placement="bottom"
          disabled={currentTime === timeLength - 1}
          onClick={() => {
            const newTime = timeLength - 1
            if (newTime >= 0) {
              dispatch(timeSelection(newTime))
            }
          }}
        >
          <MdSkipNext />
        </TooltipButton>
        <Stack sx={{ ml: 3, mr: 1.5 }} direction="row" spacing={1}>
          <ToggleButton
            size="small"
            value="loop"
            selected={looping}
            onChange={() => toggleLooping()}
          >
            <MdOutlineCached size={20} />
          </ToggleButton>
          <FormControl size="small" sx={{ width: '100px' }}>
            <Select
              value={playbackSpeed}
              onChange={(e) => {
                updatePlaybackSpeed(e.target.value)
                if (animation) {
                  toggleAnimationSpeed(e.target.value)
                }
              }}
              optionsList={[
                { value: 0.5, label: '0.5x' },
                { value: 0.75, label: '0.75x' },
                { value: 1, label: 'Normal' },
                { value: 1.25, label: '1.25x' },
                { value: 1.5, label: '1.5x' },
                { value: 2, label: '2x' },
              ]}
            />
          </FormControl>
        </Stack>
      </Box>
    </Stack>
  )
}

export default TimeControl
