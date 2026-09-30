import { Box } from '@mui/material'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { Draggable, useDraggable } from '.'

import { selectGlobalOutputProps } from '../../data/selectors'
import { draggableId, layoutType, propVariant } from '../../utils/enums'
import { Carousel } from '../compound'
import { renderPropsLayout } from '../views/common/renderLayout'

import { sortedListById } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
}

const GlobalOutputsDockedSection = () => {
  const draggable = useDraggable(draggableId.GLOBAL_OUTPUTS)
  const props = useSelector(selectGlobalOutputProps)

  const slides = useMemo(
    () =>
      R.pipe(
        R.filter(R.prop('quickView')),
        R.map(R.assoc('variant', propVariant.ICON_COMPACT_ALT)),
        sortedListById,
        R.map((prop) =>
          renderPropsLayout({
            layout: { type: layoutType.ITEM, id: prop.id, itemId: prop.id },
            items: { [prop.id]: prop },
            onChangeProp: () => null,
          })
        )
      )(props),
    [props]
  )

  return (
    <Draggable docked component={Box} sx={styles.root} {...draggable}>
      <Carousel>{slides}</Carousel>
    </Draggable>
  )
}

export default GlobalOutputsDockedSection
