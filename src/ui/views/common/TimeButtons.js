import {
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Box,
  ToggleButton,
  Slider,
  Select as MuiSelect,
} from '@mui/material'
import * as R from 'ramda'
import { useState } from 'react'
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayArrow,
  MdPause,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
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
  const [open, setOpen] = useState(false)

  const animation = R.is(Number, animationInterval)

  const advanceAnimation = () => {
    dispatch(timeAdvance(timeLength))
  }

  const dispatch = useDispatch()

  return (
    <ButtonGroup
      sx={{
        // display: timeLength === 0 ? 'none' : 'flex',
        display: 'flex',
        flexDirection: 'column',
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
          value={currentTime + 1}
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
          paddingTop: 0.5,
          paddingBottom: 0.5,
          paddingLeft: '4px',
        }}
        aria-label="contained button group"
        variant="contained"
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {animation ? (
            <TooltipButton
              title="Pause animation"
              placement="bottom"
              onClick={() => {
                clearInterval(animationInterval)
                dispatch(updateAnimation(false))
              }}
            >
              <MdPause />
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
              <MdPlayArrow />
            </TooltipButton>
          )}
          <TooltipButton
            title={`Go back to start`}
            placement="bottom"
            disabled={currentTime === 0}
            onClick={() => {
              const newTime = 0
              if (newTime >= 0) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdKeyboardDoubleArrowLeft />
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
          <TooltipButton
            title={`Set current ${timeUnits}`}
            placement="bottom"
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
            placement="bottom"
            disabled={currentTime === timeLength - 1}
            onClick={advanceAnimation}
          >
            <MdNavigateNext />
          </TooltipButton>
          <TooltipButton
            title={`Go to end`}
            placement="bottom"
            disabled={currentTime === timeLength - 1}
            onClick={() => {
              const newTime = timeLength - 1
              if (newTime >= 0) {
                dispatch(timeSelection(newTime))
              }
            }}
          >
            <MdKeyboardDoubleArrowRight />
          </TooltipButton>
        </Box>
        <Box sx={{ display: 'flex', height: '40px', paddingRight: '14px' }}>
          <ToggleButton size="small">
            <MdOutlineCached fontSize="20px" />
          </ToggleButton>
          <FormControl size="small">
            <Select
              optionsList={[
                { value: '0.5', label: '0.5x', iconName: '' },
                { value: '0.75', label: '0.75x', iconName: '' },
                { value: '1', label: 'Normal', iconName: '' },
                { value: '1.25', label: '1.25x', iconName: '' },
                { value: '1.5', label: '1.5x', iconName: '' },
                { value: '2', label: '2x', iconName: '' },
              ]}
            />
          </FormControl>
        </Box>
      </Box>
    </ButtonGroup>
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
    <ButtonGroup
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
          <MdPause />
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
          <MdPlayArrow />
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
    </ButtonGroup>
  )
}

const TimeControl = ({ compact }) =>
  compact ? <TimeControlCompact /> : <TimeControlFull />

export default TimeControl
