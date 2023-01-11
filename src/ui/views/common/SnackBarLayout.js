import * as R from 'ramda'
import React from 'react'
import { useSelector } from 'react-redux'

import SnackBar from './SnackBar'

import { selectMessages } from '../../../data/selectors'

const SnackBarLayout = () => {
  let messages = useSelector(selectMessages)

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

  console.log(messages)
  let to_show = []
  if (Object.keys(messages).length !== 0) {
    messages = filterMessages(messages)

    let keys = R.keys(messages)

    to_show = keys.map((key) => {
      return (
        <li>
          <SnackBar message={messages[1].message} messageKey={key}></SnackBar>
        </li>
      )
    })
  }
  return <ol>{to_show}</ol>
}
export default SnackBarLayout
