import { Box, IconButton, Typography } from '@mui/material'
import { memo, useCallback, useMemo, useState } from 'react'
import { MdOutlineCancel } from 'react-icons/md'
import { useSelector } from 'react-redux'

import { Draggable, DragHandle, useDraggable } from '.'

import { selectMapName, selectVirtualKeyboardValue } from '../../data/selectors'
import { draggableId } from '../../utils/enums'
import { useMutateStateWithSync } from '../../utils/hooks'
import { TextInput } from '../compound'

const styles = {
  dragRoot: {
    display: 'flex',
    alignItems: 'center',
    py: 0.5,
    bgcolor: 'rgb(0 0 0 / .7)',
    // border: '1px outset rgb(128 128 128)',
    borderRadius: 1,
    cursor: 'auto',
  },
  dragDefaultPosition: {
    x: 8,
    y: 8,
  },
  mapNameInput: {
    width: 'fit-content',
    mr: 0.5,
  },
  mapName: {
    color: 'text.primary',
    cursor: 'text',
    px: 1,
  },
}

const MapNameDraggable = ({ mapId }) => {
  const [isEditing, setIsEditing] = useState(false)

  const draggable = useDraggable(draggableId.MAP_NAMES)
  const keyboardValue = useSelector(selectVirtualKeyboardValue)
  const mapName = useSelector((state) => selectMapName(state, mapId))

  const handleSaveName = useMutateStateWithSync(
    (newName) => ({
      path: ['maps', 'data', mapId, 'name'],
      value: newName,
    }),
    [mapId]
  )

  const handleClickName = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleClickCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSaveName(keyboardValue)
        setIsEditing(false)
      }
      if (e.key === 'Escape') {
        handleClickCancel()
      }
    },
    [handleClickCancel, handleSaveName, keyboardValue]
  )

  const handleClickAway = useCallback(
    (newValue) => {
      handleSaveName(newValue)
      setIsEditing(false)
    },
    [handleSaveName]
  )

  const rootStyle = useMemo(
    () => [
      styles.dragRoot,
      isEditing && { border: 'none', p: 0.5 },
      draggable.showDragHandle && !isEditing && { pl: 1 },
    ],
    [draggable.showDragHandle, isEditing]
  )

  const dragPosition = useMemo(
    () => draggable.position ?? styles.dragDefaultPosition,
    [draggable.position]
  )

  return (
    <Draggable
      component={Box}
      {...draggable}
      position={dragPosition}
      hideMenu={isEditing}
      sx={rootStyle}
    >
      {draggable.showDragHandle && !isEditing && <DragHandle />}
      {isEditing ? (
        <>
          <TextInput
            autoFocus
            fullWidth={false}
            forceClickAwayOnBlur
            size="small"
            sx={styles.mapNameInput}
            value={mapName}
            onKeyDown={handleKeyDown}
            onClickAway={handleClickAway}
          />

          <IconButton size="small" onClick={handleClickCancel}>
            <MdOutlineCancel />
          </IconButton>
        </>
      ) : (
        <Typography
          variant="subtitle1"
          sx={styles.mapName}
          onClick={handleClickName}
        >
          {mapName || mapId}
        </Typography>
      )}
    </Draggable>
  )
}

export default memo(MapNameDraggable)
