import { Stack } from '@mui/material'
import { useState } from 'react'

import { Draggable, useDraggable } from '.'
import SessionDraggableContent from './SessionDraggableContent'

import { draggableId } from '../../utils/enums'

const styles = {
  root: {
    color: 'text.primary',
    borderRadius: 1,
    alignItems: 'center',
  },
}

const SessionDockedSection = () => {
  const [isEditing, setIsEditing] = useState(false)
  const draggable = useDraggable(draggableId.SESSION)

  return (
    <Draggable
      docked
      component={Stack}
      slotProps={{
        component: {
          direction: 'row',
        },
      }}
      sx={styles.root}
      hideMenu={isEditing}
      {...draggable}
    >
      <SessionDraggableContent docked onEditingChange={setIsEditing} />
    </Draggable>
  )
}

export default SessionDockedSection
