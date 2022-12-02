import * as R from 'ramda'

import { mutateData, overwriteData } from '../data/data'
import { mutateSessions } from '../data/sessions/sessionsSlice'

const onMessage = (dispatch) => (payload) => {
  if (R.prop('event', payload) === 'message') {
    console.log('message: ', payload)
    // TODO: Add dispatch to deploy the snackbar
  } else if (R.prop('event', payload) === 'localMutation') {
    console.log('localMutation: ', R.prop('data', payload))
    // TODO: dispatch a localMutation function
    dispatch(mutateSessions(payload.data))
  } else if (R.prop('event', payload) === 'mutation') {
    console.log('mutation: ', payload)
    dispatch(mutateData(payload))
  } else if (R.prop('event', payload) === 'overwrite') {
    console.log('overwrite: ', payload)
    dispatch(overwriteData(payload))
  } else {
    console.log('Unknown event: ', payload)
  }
}

export default onMessage
