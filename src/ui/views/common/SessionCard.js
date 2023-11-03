import '../../../App.css'
import { Card, CardContent, IconButton } from '@mui/material'
import * as R from 'ramda'
import React, { useLayoutEffect, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { useSelector } from 'react-redux'

import { selectSessions } from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'

const styles = {
  root: {
    cursor: 'move',
    display: 'flex',
    position: 'absolute',
    width: 300,
    zIndex: 5000,
  },
  content: {
    overflow: 'hidden',
    overflowWrap: 'break-word',
  },
  position: {
    left: 0,
    top: 0,
  },
}

const SessionCard = ({ enabled, setEnabled, position, setPosition }) => {
  const sessions = useSelector(selectSessions)

  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  useLayoutEffect(() => {
    const handleWindowResize = () => {
      const height = window.innerHeight
      const yMax = height - 3 * APP_BAR_WIDTH
      const yPosition = R.defaultTo(0)((height * position.top) / windowHeight)
      setPosition(R.assoc('top', R.clamp(0, yMax, yPosition), position))
      setWindowHeight(height)
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  })

  const handleSessionCardDragStart = (event) => {
    const cardStyle = window.getComputedStyle(event.target)
    const xOffset = parseInt(cardStyle.getPropertyValue('left')) - event.clientX
    const yOffset = parseInt(cardStyle.getPropertyValue('top')) - event.clientY
    const cardWidth = cardStyle.getPropertyValue('width')
    const cardHeight = cardStyle.getPropertyValue('height')
    event.dataTransfer.setData(
      'text/plain',
      `${xOffset},${yOffset},${cardWidth},${cardHeight}`
    )
  }

  const sessionIdCurrent = `${sessions.session_id}`
  const teamAllSessions = R.pipe(
    R.prop('data'),
    R.values,
    R.find(R.hasPath(['sessions', sessionIdCurrent])),
    R.defaultTo({})
  )(sessions)
  const sessionName = R.path(
    ['sessions', sessionIdCurrent, 'sessionName'],
    teamAllSessions
  )
  return (
    <>
      {enabled && (
        <Card
          draggable
          onDragStart={handleSessionCardDragStart}
          style={R.mergeAll([
            {
              backgroundColor: '#132a73',
            },
            styles.root,
            position,
          ])}
        >
          <CardContent style={styles.content}>
            {`Current Session: ${sessionName}`}
          </CardContent>
          <IconButton onClick={() => setEnabled(false)}>
            <MdOutlineClose />
          </IconButton>
        </Card>
      )}
    </>
  )
}

export default SessionCard
