import * as R from 'ramda'
import React from 'react'
import { useSelector } from 'react-redux'

import SnackBar from './SnackBar'

import { selectMessages } from '../../../data/selectors'

const SnackBarLayout = () => {
  const filterMessages = (list) => {
    let to_remove = []
    for (let i = 1; i < Object.keys(list).length; i++) {
      if (R.path([i, 'snackbarShow'], list) !== true) {
        to_remove.push(i)
      }
    }
    for (let i = 0; i < to_remove.length; i++) {
      R.dissoc(to_remove[i], list)
    }
    return list
  }

  let messages = useSelector(selectMessages)
  let to_show = null

  if (Object.keys(messages).length !== 0) {
    messages = filterMessages(messages)
    let keys = R.keys(messages)
    to_show = (
      <SnackBar
        message={messages[keys[0]].message}
        messageKey={keys[0]}
      ></SnackBar>
    )
  }

  return <div>{to_show}</div>
}
export default SnackBarLayout
