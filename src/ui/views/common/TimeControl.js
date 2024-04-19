import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Box,
  ToggleButton,
  Slider,
  Stack,
  Select as MuiSelect,
} from '@mui/material'
import * as R from 'ramda'
import { useState, useEffect, useCallback } from 'react'
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
} from '../../../data/selectors'
import { updateAnimation } from '../../../data/utilities/timeSlice'
import Select from '../../compound/Select'
import TooltipButton from '../../compound/TooltipButton'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.paper',
  },
  slider: {
    mt: 2,
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

const TimeControlFull = () => {
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [looping, setLooping] = useState(false)

  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const animationInterval = useSelector(selectAnimationInterval)
  const dispatch = useDispatch()

  const animation = R.is(Number, animationInterval)

  const advanceAnimation = useCallback(() => {
    dispatch(timeAdvance(timeLength))
  }, [dispatch, timeLength])

  useEffect(() => {
    if (!looping && currentTime + 1 === timeLength) {
      clearInterval(animationInterval)
      dispatch(updateAnimation(false))
    }
  }, [currentTime, looping, timeLength, animationInterval, dispatch])

  const togglePlaybackSpeed = useCallback(
    (newPlaybackSpeed) => {
      clearInterval(animationInterval)
      dispatch(updateAnimation(false))
      const newAnimationInterval = setInterval(
        advanceAnimation,
        1000 / newPlaybackSpeed
      )
      dispatch(updateAnimation(newAnimationInterval))
    },
    [advanceAnimation, animationInterval, dispatch]
  )

  return (
    <Stack
      sx={[
        styles.root,
        // display: timeLength === 0 ? 'none' : 'flex',
      ]}
    >
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
              togglePlaybackSpeed(playbackSpeed)
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
            onChange={() => setLooping(!looping)}
          >
            <MdOutlineCached size={20} />
          </ToggleButton>
          <FormControl size="small" sx={{ width: '100px' }}>
            <Select
              value={playbackSpeed}
              onChange={(e) => {
                setPlaybackSpeed(e.target.value)
                if (animation) {
                  togglePlaybackSpeed(e.target.value)
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

const TimeControlCompact = () => {
  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const animationInterval = useSelector(selectAnimationInterval)
  const [open, setOpen] = useState(false)

  const animation = R.is(Number, animationInterval)

  const advanceAnimation = () => {
    dispatch(timeAdvance(timeLength))
  }

  const dispatch = useDispatch()

  return (
    <Box
      sx={{
        // display: timeLength === 0 ? 'none' : '',
        width: '100%',
        bgcolor: 'background.paper',
      }}
      aria-label="contained button group"
      variant="contained"
    >
      <TooltipButton
        title={`Reduce time by one ${timeUnits}`}
        placement="left-end"
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
          placement="top"
          onClick={() => {
            clearInterval(animationInterval)
            dispatch(updateAnimation(false))
          }}
        >
          <MdPauseCircle />
        </TooltipButton>
      ) : (
        <TooltipButton
          title="Play animation"
          placement="top"
          onClick={() => {
            const animationInterval = setInterval(advanceAnimation, 1000)
            dispatch(updateAnimation(animationInterval))
          }}
        >
          <MdPlayCircle />
        </TooltipButton>
      )}
      <TooltipButton
        title={`Set current ${timeUnits}`}
        placement="top"
        onClick={() => {
          setOpen(true)
        }}
      >
        {currentTime + 1}
      </TooltipButton>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
        }}
      >
        <DialogTitle>{`Set ${timeUnits}`}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="time-select-label">{`Choose a ${timeUnits}`}</InputLabel>
              <MuiSelect
                value={currentTime}
                onChange={(event) => {
                  dispatch(timeSelection(event.target.value))
                  setOpen(false)
                }}
              >
                {R.map((time) => (
                  <MenuItem key={time} value={time - 1}>
                    {time}
                  </MenuItem>
                ))(R.range(1, timeLength + 1))}
              </MuiSelect>
            </FormControl>
          </Box>
        </DialogContent>
      </Dialog>
      <TooltipButton
        title={`Advance time by one ${timeUnits}`}
        placement="top"
        disabled={currentTime === timeLength - 1}
        onClick={advanceAnimation}
      >
        <MdNavigateNext />
      </TooltipButton>
    </Box>
  )
}

const TimeControl = ({ compact }) =>
  compact ? <TimeControlCompact /> : <TimeControlFull />

export default TimeControl
