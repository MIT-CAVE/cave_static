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
  // Select as MuiSelect,
} from '@mui/material'
import * as R from 'ramda'
import { useState } from 'react'
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

const TimeControlFull = () => {
  const currentTime = useSelector(selectCurrentTime)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const animationInterval = useSelector(selectAnimationInterval)
  // const [open, setOpen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [toggleSelected, setToggleSelected] = useState(false)

  const animation = R.is(Number, animationInterval)

  const advanceAnimation = () => {
    dispatch(timeAdvance(timeLength))
  }

  const dispatch = useDispatch()

  console.log(currentTime)

  return (
    <Stack
      sx={{
        // display: timeLength === 0 ? 'none' : 'flex',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          borderBottom: 0,
          paddingRight: 100,
          height: '50px',
          alignItems: 'end',
        }}
      >
        <Slider
          onMouseDown={(event) => {
            event.stopPropagation()
          }}
          aria-label="time slider"
          defaultValue={1}
          valueLabelDisplay="on"
          step={1}
          min={1}
          max={timeLength}
          value={currentTime}
          onChange={(e, newValue) => dispatch(timeSelection(newValue))}
          sx={{ marginRight: '12px', marginLeft: '12px' }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          borderTop: 0,
          paddingBottom: 1,
          paddingLeft: '4px',
        }}
        aria-label="contained button group"
        variant="contained"
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TooltipButton
            title={`Go back to start`}
            placement="bottom"
            disabled={currentTime === 1}
            onClick={() => {
              const newTime = 1
              if (newTime >= 1) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdSkipPrevious size={40} />
          </TooltipButton>
          <TooltipButton
            title={`Reduce time by one ${timeUnits}`}
            placement="bottom"
            disabled={currentTime === 1}
            onClick={() => {
              const newTime = currentTime - 1
              if (newTime >= 1) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdNavigateBefore size={40} />
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
                const animationInterval = setInterval(advanceAnimation, 1000)
                dispatch(updateAnimation(animationInterval))
              }}
            >
              <MdPlayCircle size={40} />
            </TooltipButton>
          )}
          {/* <TooltipButton
            title={`Set current ${timeUnits}`}
            placement="bottom"
            onClick={() => {
              setOpen(true)
            }}
          >
            {currentTime + 1}
          </TooltipButton> */}
          {/* <Dialog
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
          </Dialog> */}
          <TooltipButton
            title={`Advance time by one ${timeUnits}`}
            placement="bottom"
            disabled={currentTime === timeLength}
            // onClick={advanceAnimation}
            onClick={() => {
              const newTime = currentTime + 1
              if (newTime <= timeLength) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdNavigateNext size={40} />
          </TooltipButton>
          <TooltipButton
            title={`Go to end`}
            placement="bottom"
            disabled={currentTime === timeLength}
            onClick={() => {
              const newTime = timeLength
              if (newTime >= 1) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdSkipNext size={40} />
          </TooltipButton>
        </Box>
        <Box
          sx={{
            display: 'flex',
            height: '40px',
            paddingRight: '14px',
            paddingTop: '4px',
          }}
        >
          <ToggleButton
            size="small"
            sx={{ height: '40px' }}
            selected={toggleSelected}
            onChange={() => setToggleSelected(!toggleSelected)}
          >
            <MdOutlineCached size={40} />
          </ToggleButton>
          <FormControl size="small">
            <Select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(e.target.value)}
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
        </Box>
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
              <Select
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
              </Select>
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
