import { Snackbar, IconButton } from '@mui/material'
import React, { useState, Fragment } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch } from 'react-redux'

import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = ({ message, messageKey, duration }) => {
  const [open, setOpen] = useState(true)
  const dispatch = useDispatch()

  const handleClose = () => {
    dispatch(removeMessage({ messageKey: messageKey }))
    setOpen(false)
  }

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

  return (
    <Snackbar
      open={open}
      message={message}
      action={ClosingButton}
      autoHideDuration={duration}
      onClose={handleClose}
    />
  )
}
export default SnackBar
