import { Alert, AlertTitle, Collapse, IconButton, Stack } from '@mui/material'
import * as R from 'ramda'
import React, { Fragment } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import { TransitionGroup } from 'react-transition-group'

import { selectMessages } from '../../../data/selectors'
import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = () => {
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()

  const handleClose = R.thunkify((messageKey) => {
    dispatch(removeMessage({ messageKey: messageKey }))
  })

  // TODO: Add duration to messages
  // const calculateDuration = R.pipe(
  //   R.propOr(null, 'duration'),
  //   R.unless(R.isNil, R.multiply(1000))
  // )

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
      justifyContent="center"
      alignItems="center"
      sx={{ position: 'fixed', bottom: 15, width: '100%', zIndex: 2001 }}
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
