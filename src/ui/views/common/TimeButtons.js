import {
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material'
import * as R from 'ramda'
import { useState } from 'react'
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayArrow,
  MdPause,
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
import TooltipButton from '../../compound/TooltipButton'

const TimeButtons = () => {
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
        display: timeLength === 0 ? 'none' : '',
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

export default TimeButtons
