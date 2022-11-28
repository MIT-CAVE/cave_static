import * as R from 'ramda'

import { mutateData } from '../data/data'
import { updateTeam } from '../data/sessions/sessionsSlice'

const onMessage = (dispatch) => (payload) => {
  if (R.prop('event', payload) === 'message') {
    console.log('message: ', payload)
    // TODO: Add dispatch to deploy the snackbar
  } else if (R.prop('event', payload) === 'localMutation') {
    console.log('localMutation: ', R.prop('data', payload))
    // TODO: dispatch a localMutation function
    dispatch(updateTeam(payload.data))
  } else {
    dispatch(mutateData(payload))
  }
}

export default onMessage
