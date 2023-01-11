import { Snackbar, IconButton } from '@mui/material'
import * as React from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch } from 'react-redux'

import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = ({ message, messageKey }) => {
  let open = true
  const dispatch = useDispatch()

  const ClosingButton = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={() => {
          open = false
          dispatch(removeMessage({ messageKey: messageKey }))
        }}
      >
        <AiFillCloseCircle fontSize="small" />
      </IconButton>
    </React.Fragment>
  )

  return (
    <Snackbar open={open} message={message} action={ClosingButton}></Snackbar>
  )
}
export default SnackBar
