import { Box } from '@mui/material'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { Draggable, DragHandle, useDraggable } from '.'

import { selectGlobalOutputProps } from '../../data/selectors'
import { draggableId, layoutType, propVariant } from '../../utils/enums'
import { renderPropsLayout } from '../views/common/renderLayout'

const styles = {
  root: {
    p: 1,
    bgcolor: 'background.paper',
    borderRadius: 2,
  },
  layout: {
    gap: '8px',
    mask: 'radial-gradient(circle 24px at 100% 0%, #0000 95%, #000 100%)',
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

const GlobalOutputsDraggable = () => {
  const draggable = useDraggable(draggableId.GLOBAL_OUTPUTS)
  const props = useSelector(selectGlobalOutputProps)

  const globalOutputs = useMemo(
    () =>
      R.pipe(
        R.map(R.assoc('variant', propVariant.ICON_COMPACT)),
        R.filter(R.prop('draggable'))
      )(props),
    [props]
  )

  const layout = useMemo(
    () => ({
      type: layoutType.GRID,
      numRows: Math.ceil(R.keys(globalOutputs).length / 3),
      minColumnWidth: 'min-content',
      style: R.when(
        R.always(draggable.showDragHandle),
        R.assoc(
          'clipPath',
          'polygon(0 22px,22px 22px,22px 0,100% 0,100% 100%,0 100%)'
        )
      )(styles.layout),
    }),
    [draggable.showDragHandle, globalOutputs]
  )

  const slotProps = useMemo(
    () => ({
      menuRoot: { sx: styles.menuRoot },
    }),
    []
  )

  return (
    <Draggable
      // cancel={'.MuiButtonBase-root'}
      sx={{ borderRadius: 2 }}
      {...{ slotProps, ...draggable }}
    >
      <Box sx={styles.root}>
        {renderPropsLayout({
          layout,
          items: globalOutputs,
          onChangeProp: () => null,
        })}
      </Box>
      {draggable.showDragHandle && <DragHandle sx={styles.dragHandle} />}
    </Draggable>
  )
}

export default GlobalOutputsDraggable
