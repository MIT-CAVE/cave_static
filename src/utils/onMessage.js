import * as R from 'ramda'

import downloadFile from './downloadFile'

import { mutateData, overwriteData } from '../data/data'
import { updateLoading } from '../data/utilities/loadingSlice'
import { addMessage } from '../data/utilities/messagesSlice'
import { updateSessions } from '../data/utilities/sessionsSlice'

const onMessage = (dispatch) => (payload) => {
  if (R.prop('event', payload) === 'message') {
    console.log('message: ', payload)
    dispatch(addMessage(payload))
  } else if (R.prop('event', payload) === 'updateSessions') {
    // console.log('localMutation: ', R.prop('data', payload))
    dispatch(updateSessions(payload))
  } else if (R.prop('event', payload) === 'updateLoading') {
    // console.log('localMutation: ', R.prop('data', payload))
    dispatch(updateLoading(payload))
  } else if (R.prop('event', payload) === 'mutation') {
    // console.log('mutation: ', payload)
    dispatch(mutateData(payload))
  } else if (R.prop('event', payload) === 'overwrite') {
    // console.log('overwrite: ', payload)
    dispatch(overwriteData(payload))
  } else if (R.prop('event', payload) === 'export') {
    const { data, name } = R.prop('data', payload)
    downloadFile(data, name)
  } else {
    console.log('Unknown event: ', payload)
  }
}

export default onMessage
