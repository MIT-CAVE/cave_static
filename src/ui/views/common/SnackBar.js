import { Snackbar, IconButton } from '@mui/material'
import * as R from 'ramda'
import React, { Fragment } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'

import { selectMessages } from '../../../data/selectors'
import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = () => {
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()
  const filterMessages = R.filter(R.prop('snackbarShow'))

  const filteredMessages = filterMessages(messages)
  const keys = R.keys(filteredMessages)

  const handleClose = () => {
    dispatch(removeMessage({ messageKey: keys[0] }))
  }

  const calculateDuration = R.pipe(
    R.propOr(null, 'duration'),
    R.unless(R.isNil, R.multiply(1000))
  )

  const ClosingButton = (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <AiFillCloseCircle fontSize="small" />
      </IconButton>
    </Fragment>
  )
  let vertical = 'bottom'
  let horizontal = 'center'

  return R.isEmpty(filteredMessages) ? (
    []
  ) : (
    <div>
      <Snackbar
        open={true}
        message={filteredMessages[keys[0]].message}
        messageKey={keys[0]}
        duration={calculateDuration(filteredMessages[keys[0]])}
        anchorOrigin={{ vertical, horizontal }}
        action={ClosingButton}
      ></Snackbar>
    </div>
  )
}

export default SnackBar
