import * as R from 'ramda'

import { mutateData, overwriteData } from '../data/data'
import { addMessage } from '../data/utilities/messagesSlice'
import { mutateSessions } from '../data/utilities/sessionsSlice'

const onMessage = (dispatch) => (payload) => {
  if (R.prop('event', payload) === 'message') {
    console.log('message: ', payload)
    dispatch(addMessage(payload.data))
  } else if (R.prop('event', payload) === 'localMutation') {
    // console.log('localMutation: ', R.prop('data', payload))
    dispatch(mutateSessions(payload.data))
  } else if (R.prop('event', payload) === 'mutation') {
    // console.log('mutation: ', payload)
    dispatch(mutateData(payload))
  } else if (R.prop('event', payload) === 'overwrite') {
    // console.log('overwrite: ', payload)
    dispatch(overwriteData(payload))
  } else {
    console.log('Unknown event: ', payload)
  }
}

export default onMessage
