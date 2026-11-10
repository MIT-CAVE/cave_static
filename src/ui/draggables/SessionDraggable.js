import { Stack } from '@mui/material'
import { useMemo, useState } from 'react'

import { Draggable, DragHandle, useDraggable } from '.'
import SessionDraggableContent from './SessionDraggableContent'

import { draggableId } from '../../utils/enums'

const styles = {
  root: {
    bgcolor: '#132a73',
    color: 'text.primary',
    border: 1,
    p: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
}

const SessionDraggable = () => {
  const [isEditing, setIsEditing] = useState(false)
  const draggable = useDraggable(draggableId.SESSION)

  const sessionStyles = useMemo(
    () => [styles.root, draggable.hideClose && { pr: 0 }],
    [draggable.hideClose]
  )

  return (
    <Draggable
      component={Stack}
      slotProps={{
        component: {
          spacing: 1,
          direction: 'row',
        },
      }}
      sx={sessionStyles}
      hideMenu={isEditing}
      {...draggable}
    >
      {draggable.showDragHandle && !isEditing && <DragHandle />}
      <SessionDraggableContent onEditingChange={setIsEditing} />
    </Draggable>
  )
}

export default SessionDraggable
