import { Draggable, DragHandle, useDraggable } from '.'

import { draggableId } from '../../utils/enums'
import TimeControl from '../views/common/TimeControl'

const styles = {
  root: {
    // width: '400px',
    bgcolor: 'background.paper',
  },
  menuRoot: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dragHandle: {
    position: 'absolute',
    top: '4px',
    left: '4px',
  },
}

const TimeDraggable = () => {
  const draggable = useDraggable(draggableId.TIME)
  return (
    <Draggable
      // cancel={'.MuiButtonBase-root, .MuiFormControl-root, .MuiSlider-thumb'}
      sx={styles.root}
      slotProps={{
        menuRoot: { sx: styles.menuRoot },
      }}
      {...draggable}
    >
      <TimeControl showDragHandle={draggable.showDragHandle} />
      {draggable.showDragHandle && <DragHandle sx={styles.dragHandle} />}
    </Draggable>
  )
}

export default TimeDraggable
