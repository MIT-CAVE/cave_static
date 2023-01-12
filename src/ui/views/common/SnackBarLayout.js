import * as R from 'ramda'
import React from 'react'
import { useSelector } from 'react-redux'

import SnackBar from './SnackBar'

import { selectMessages } from '../../../data/selectors'

const SnackBarLayout = () => {
  const messages = useSelector(selectMessages)

  const filterMessages = R.filter(R.prop('snackbarShow'))
  const calculateDuration = R.pipe(
    R.propOr(null, 'duration'),
    R.unless(R.isNil, R.multiply(1000))
  )

  const filteredMessages = filterMessages(messages)
  const keys = R.keys(filteredMessages)

  return R.isEmpty(filteredMessages) ? (
    []
  ) : (
    <div>
      <SnackBar
        message={filteredMessages[keys[0]].message}
        messageKey={keys[0]}
        duration={calculateDuration(filteredMessages[keys[0]])}
      ></SnackBar>
    </div>
  )
}
export default SnackBarLayout
