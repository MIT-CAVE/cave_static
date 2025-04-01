import { Alert, AlertTitle, Collapse, IconButton, Stack } from '@mui/material'
import * as R from 'ramda'
import React, { Fragment, useEffect, useRef } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import { TransitionGroup } from 'react-transition-group'

import { selectMessages } from '../../../data/selectors'
import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = () => {
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()

  const closingTimers = useRef({})

  useEffect(
    () => () => {
      R.forEach((item) => clearTimeout(item), R.values(closingTimers.current))
    },
    []
  )

  const handleClose = R.thunkify((messageKey) => {
    if (R.has(messageKey, closingTimers.current)) {
      clearTimeout(closingTimers.current.messageKey)
      closingTimers.current = R.dissoc(messageKey, closingTimers.current)
    }
    dispatch(removeMessage({ messageKey: messageKey }))
  })

  const closingButton = (maxKey) => (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose(maxKey)}
      >
        <AiFillCloseCircle fontSize="large" />
      </IconButton>
    </Fragment>
  )

  const caveAlert = (message, messageId) => {
    if (
      R.has('duration', message) &&
      !R.has(messageId, closingTimers.current)
    ) {
      closingTimers.current[messageId] = setTimeout(() => {
        closingTimers.current = R.dissoc(messageId, closingTimers.current)
        dispatch(removeMessage({ messageKey: messageId }))
      }, message.duration * 1000)
    }
    return (
      <Collapse key={messageId}>
        <Alert
          severity={message.snackbarType}
          action={closingButton(messageId)}
          sx={{ width: '700px' }}
        >
          <AlertTitle>{message.title}</AlertTitle>
          {message.message}
        </Alert>
      </Collapse>
    )
  }
  return R.isEmpty(messages) ? (
    []
  ) : (
    <Stack
      sx={{
        position: 'fixed',
        justifyContent: 'center',
        alignItems: 'center',
        bottom: '20px',
        right: '20px',
        bgcolor: 'background.paper',
        zIndex: 2001,
      }}
    >
      <TransitionGroup>
        {R.pipe(
          R.mapObjIndexed((message, messageKey) =>
            caveAlert(message, messageKey)
          ),
          R.values
        )(messages)}
      </TransitionGroup>
    </Stack>
  )
}

export default SnackBar
