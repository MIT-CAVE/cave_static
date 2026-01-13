import { Box, Stack } from '@mui/material'
import * as R from 'ramda'
import { useCallback } from 'react'
import { MdPlayCircle, MdPauseCircle } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { timeAdvance } from '../../../data/local/settingsSlice'
import {
  selectAnimationInterval,
  selectAnimationDuration,
} from '../../../data/selectors'
import { updateAnimation } from '../../../data/utilities/timeSlice'
import TooltipButton from '../../compound/TooltipButton'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    bgcolor: 'background.paper',
    borderRadius: 1,
  },
  animControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    p: 3,
  },
}

const TimeButton = (props) => (
  <TooltipButton sx={{ border: 0, borderRadius: '50%', p: 0.5 }} {...props} />
)

const AnimationControl = () => {
  const playbackSpeed = 1
  const animationInterval = useSelector(selectAnimationInterval)
  const duration = useSelector(selectAnimationDuration)

  const dispatch = useDispatch()

  const animation = R.is(Number, animationInterval)

  const advanceAnimation = useCallback(() => {
    dispatch(timeAdvance(duration))
  }, [dispatch, duration])

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
      <Box sx={styles.animControls}>
        {animation ? (
          <TimeButton
            title="Pause animation"
            placement="bottom"
            onClick={() => {
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
              toggleAnimationSpeed(playbackSpeed)
            }}
          >
            <MdPlayCircle size={40} />
          </TimeButton>
        )}
      </Box>
    </Stack>
  )
}

export default AnimationControl
