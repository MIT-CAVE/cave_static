import { useSelector } from 'react-redux'

import {
  selectLeftGroupedAppBar,
  selectMirrorMode,
  selectPaneState,
  selectRightGroupedAppBar,
} from '../../../data/selectors'

// Retrieve app bar data tied to the side
const useAppBar = (side) => {
  const mirrorMode = useSelector(selectMirrorMode)
  const paneState = useSelector(selectPaneState)
  const rightGroupedAppBar = useSelector(selectRightGroupedAppBar)
  const leftGroupedAppBar = useSelector(selectLeftGroupedAppBar)
  return {
    open: paneState[side]?.open ?? '',
    pin: paneState[side]?.pin ?? false,
    source: !mirrorMode ? side : side === 'left' ? 'right' : 'left',
    appBar: !mirrorMode
      ? side === 'left'
        ? leftGroupedAppBar
        : rightGroupedAppBar
      : side === 'left'
        ? rightGroupedAppBar
        : leftGroupedAppBar,
  }
}

export default useAppBar
