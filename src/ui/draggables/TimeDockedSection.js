import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  MdNavigateNext,
  MdNavigateBefore,
  MdPlayCircle,
  MdPauseCircle,
  MdSkipPrevious,
  MdSkipNext,
  MdOutlineCached,
} from 'react-icons/md'

import { Draggable, useDraggable } from '.'

import { draggableId } from '../../utils/enums'
import TooltipButton from '../compound/TooltipButton'
import {
  TIME_SPEED_SHORTCUTS,
  useTimeControl,
} from '../views/common/useTimeControl'

const NAV_ICON_SIZE = 20
const PLAY_ICON_SIZE = 24

const styles = {
  root: {
    alignItems: 'center',
  },
  rows: {
    alignItems: 'stretch',
  },
  statusRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentTime: {
    display: 'inline-block',
    textAlign: 'right',
  },
  transportRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transportButtons: {
    alignItems: 'center',
  },
  readout: {
    whiteSpace: 'nowrap',
    mr: 2,
  },
  speedButton: {
    textTransform: 'none',
  },
}

const TimeButton = (props) => (
  <TooltipButton sx={{ border: 0, borderRadius: '50%', p: 0.5 }} {...props} />
)

const TimeDockedSection = () => {
  const draggable = useDraggable(draggableId.TIME)
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
    <Draggable
      docked
      component={Stack}
      slotProps={{
        component: {
          direction: 'row',
        },
      }}
      sx={styles.root}
      {...draggable}
    >
      <Stack spacing={0.5} useFlexGap sx={styles.rows}>
        <Stack direction="row" spacing={1} useFlexGap sx={styles.statusRow}>
          <Typography variant="body2" sx={styles.readout}>
            <Box
              component="span"
              sx={[
                styles.currentTime,
                { minWidth: `${String(timeLength).length}ch` },
              ]}
            >
              {currentTime}
            </Box>
            {` / ${timeLength} ${timeUnits}`}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={playbackSpeed}
            onChange={(event, newValue) => {
              if (newValue !== null) {
                setPlaybackSpeed(newValue)
              }
            }}
          >
            {TIME_SPEED_SHORTCUTS.map(({ value, label }) => (
              <ToggleButton key={value} value={value} sx={styles.speedButton}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={styles.transportRow}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={styles.transportButtons}
          >
            <TimeButton
              title="Go back to start"
              placement="bottom"
              disabled={currentTime === 0}
              onClick={() => setTime(0)}
            >
              <MdSkipPrevious size={NAV_ICON_SIZE} />
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
              <MdNavigateBefore size={NAV_ICON_SIZE} />
            </TimeButton>
            <TimeButton
              title={animation ? 'Pause animation' : 'Play animation'}
              placement="bottom"
              onClick={animation ? handlePause : handlePlay}
            >
              {animation ? (
                <MdPauseCircle size={PLAY_ICON_SIZE} />
              ) : (
                <MdPlayCircle size={PLAY_ICON_SIZE} />
              )}
            </TimeButton>
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
              <MdNavigateNext size={NAV_ICON_SIZE} />
            </TimeButton>
            <TimeButton
              title="Go to end"
              placement="bottom"
              disabled={currentTime === timeLength}
              onClick={() => setTime(timeLength)}
            >
              <MdSkipNext size={NAV_ICON_SIZE} />
            </TimeButton>
          </Stack>
          <ToggleButton
            size="small"
            value="loop"
            selected={looping}
            onChange={handleChangeLooping}
          >
            <MdOutlineCached size={NAV_ICON_SIZE} />
          </ToggleButton>
        </Stack>
      </Stack>
    </Draggable>
  )
}

export default TimeDockedSection
