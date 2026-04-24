import * as R from 'ramda'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GlobalOutputsDraggable from './GlobalOutputsDraggable'
import SessionDraggable from './SessionDraggable'
import TimeDraggable from './TimeDraggable'

import { sendCommand } from '../../data/data'
import {
  selectGlobalOutputProps,
  selectMergedDraggables,
} from '../../data/selectors'
import { draggableId } from '../../utils/enums'

// const styles = {
//   icon: {
//     color: 'black',
//   },
//   buttons: {
//     display: 'flex',
//     alignItems: 'center',
//   },
// }

const Draggables = () => {
  const draggables = useSelector(selectMergedDraggables)
  const props = useSelector(selectGlobalOutputProps)
  const dispatch = useDispatch()

  const anyDraggableGlobalOutput = useMemo(
    () => R.pipe(R.values, R.any(R.prop('draggable')))(props),
    [props]
  )

  // Request session info if we have none
  useEffect(() => {
    if (!draggables[draggableId.SESSION]?.open) return
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'refresh',
        },
      })
    )
  }, [dispatch, draggables])

  return (
    // Either we specify a z-index for each Pad or
    // we sort them from lowest to highest priority
    <>
      {anyDraggableGlobalOutput &&
        draggables[draggableId.GLOBAL_OUTPUTS]?.open && (
          <GlobalOutputsDraggable />
        )}
      {draggables[draggableId.TIME]?.open && <TimeDraggable />}
      {draggables[draggableId.SESSION]?.open && <SessionDraggable />}
    </>
  )
}

export default Draggables
