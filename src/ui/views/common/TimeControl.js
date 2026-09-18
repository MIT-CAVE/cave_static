import { Box, ToggleButton, Slider, Stack } from '@mui/material'
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayCircle,
  MdPauseCircle,
  MdSkipPrevious,
  MdSkipNext,
  MdOutlineCached,
} from 'react-icons/md'

import { TIME_SPEED_OPTIONS, useTimeControl } from './useTimeControl'

import Select from '../../compound/Select'
import TooltipButton from '../../compound/TooltipButton'

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
  const {
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
  } = useTimeControl()

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
        onChange={(e, newValue) => setTime(newValue)}
      />
      <Box sx={styles.animControls}>
        <TimeButton
          title="Go back to start"
          placement="bottom"
          disabled={currentTime === 0}
          onClick={() => setTime(0)}
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
              setTime(newTime)
            }
          }}
        >
          <MdNavigateBefore />
        </TimeButton>

        {animation ? (
          <TimeButton
            title="Pause animation"
            placement="bottom"
            onClick={handlePause}
          >
            <MdPauseCircle size={40} />
          </TimeButton>
        ) : (
          <TimeButton
            title="Play animation"
            placement="bottom"
            onClick={handlePlay}
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
              setTime(newTime)
            }
          }}
        >
          <MdNavigateNext />
        </TimeButton>
        <TimeButton
          title="Go to end"
          placement="bottom"
          disabled={currentTime === timeLength}
          onClick={() => setTime(timeLength)}
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
            optionsList={TIME_SPEED_OPTIONS}
            value={playbackSpeed}
            onChange={(event) => setPlaybackSpeed(event.target.value)}
          />
        </Stack>
      </Box>
    </Stack>
  )
}

export default TimeControl
