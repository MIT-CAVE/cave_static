import { Box, ToggleButton, Slider, Stack } from '@mui/material'
import * as R from 'ramda'
import { useEffect, useCallback, useRef } from 'react'
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
import Select from '../../compound/Select'
import TooltipButton from '../../compound/TooltipButton'

import { includesPath } from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.paper',
    borderRadius: 1,
  },
  slider: {
    mt: 4,
    ml: 3,
    width: 'calc(100% - 48px)',
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

const TimeButton = (props) => (
  <TooltipButton sx={{ border: 0, borderRadius: '50%', p: 0.5 }} {...props} />
)

const TimeControl = () => {
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

  // const advanceAnimation = useCallback(() => {
  //   dispatch(timeAdvance(timeLength))
  // }, [dispatch, timeLength])

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
    // const newAnimationInterval = setInterval(
    //   advanceAnimation,
    //   1000 / newPlaybackSpeed
    // )
    const newAnimationInterval = setInterval(advanceContinuous, 1)
    dispatch(updateAnimation(newAnimationInterval))
  }, [advanceContinuous, animationInterval, dispatch])

  const handleChange = useCallback(
    (event) => {
      updatePlaybackSpeed(event.target.value)
      if (animation) {
        toggleAnimationSpeed()
      }
    },
    [animation, toggleAnimationSpeed, updatePlaybackSpeed]
  )

  const handleClick = useCallback(() => {
    const newTime = timeLength
    if (newTime >= 0) {
      dispatch(timeSelection(newTime))
    }
  }, [dispatch, timeLength])

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
        min={0}
        step={1}
        value={currentTime}
        onChange={(e, newValue) => {
          dispatch(timeSelection(newValue))
        }}
      />
      <Box sx={styles.animControls}>
        <TimeButton
          title="Go back to start"
          placement="bottom"
          disabled={currentTime === 0}
          onClick={() => {
            dispatch(timeSelection(0))
          }}
        >
          <MdSkipPrevious />
        </TimeButton>
        <TimeButton
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
        </TimeButton>

        {animation ? (
          <TimeButton
            title="Pause animation"
            placement="bottom"
            onClick={() => {
              dispatch(timePause())
              clearInterval(animationInterval)
              dispatch(updateAnimation(false))
            }}
          >
            <MdPauseCircle size={40} />
          </TimeButton>
        ) : (
          <TimeButton
            title="Play animation"
            placement="bottom"
            onClick={() => {
              dispatch(timeSetStart())
              toggleAnimationSpeed()
            }}
          >
            <MdPlayCircle size={40} />
          </TimeButton>
        )}
        <TimeButton
          title={`Advance time by one ${timeUnits}`}
          placement="bottom"
          disabled={currentTime === timeLength}
          onClick={() => {
            const newTime = currentTime + 1
            if (newTime <= timeLength) {
              dispatch(timeSelection(newTime))
            }
          }}
        >
          <MdNavigateNext />
        </TimeButton>
        <TimeButton
          title="Go to end"
          placement="bottom"
          disabled={currentTime === timeLength}
          onClick={handleClick}
        >
          <MdSkipNext />
        </TimeButton>
        <Stack sx={{ ml: 3, mr: 1.5 }} direction="row" spacing={1}>
          <ToggleButton
            size="small"
            value="loop"
            selected={looping}
            onChange={handleChangeLooping}
          >
            <MdOutlineCached size={20} />
          </ToggleButton>
          <Select
            size="small"
            sx={{
              '&> :first-child': {
                justifyContent: 'center',
              },
            }}
            slotProps={{
              formControl: {
                sx: { width: '100px' },
              },
            }}
            optionsList={[
              { value: 0.5, label: '0.5x' },
              { value: 0.75, label: '0.75x' },
              { value: 1, label: 'Normal' },
              { value: 1.25, label: '1.25x' },
              { value: 1.5, label: '1.5x' },
              { value: 2, label: '2x' },
            ]}
            value={playbackSpeed}
            onChange={handleChange}
          />
        </Stack>
      </Box>
    </Stack>
  )
}

export default TimeControl
