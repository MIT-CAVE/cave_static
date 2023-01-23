import { Snackbar, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import * as R from 'ramda'
import React, { Fragment } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'

import { selectMessages } from '../../../data/selectors'
import { removeMessage } from '../../../data/utilities/messagesSlice'

const SnackBar = () => {
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()
  const theme = useTheme()
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

  const styles = {
    error: {
      background: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
    warning: {
      background: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
    },
    other: {},
  }

  const getSx = R.pipe(
    R.propOr(null, 'snackbarType'),
    R.propOr(styles.other, R.__, styles)
  )

  return R.isEmpty(filteredMessages) ? (
    []
  ) : (
    <div>
      <Snackbar
        open={true}
        message={filteredMessages[keys[0]].message}
        messageKey={keys[0]}
        onClose={handleClose}
        autoHideDuration={calculateDuration(filteredMessages[keys[0]])}
        anchorOrigin={{ vertical, horizontal }}
        action={ClosingButton}
        ContentProps={{
          sx: getSx(filteredMessages[keys[0]]),
        }}
      ></Snackbar>
    </div>
  )
}

export default SnackBar
