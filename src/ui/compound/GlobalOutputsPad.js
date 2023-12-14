import { Box } from '@mui/material'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectGlobalOutputProps } from '../../data/selectors'
import { layoutType, propVariant } from '../../utils/enums'
import { renderPropsLayout } from '../views/common/renderLayout'

const style = {
  p: 1.5,
  bgcolor: 'background.paper',
  borderRadius: 1,
}

const GlobalOutputsPad = () => {
  const props = useSelector(selectGlobalOutputProps)

  const globalOutputs = R.pipe(
    R.map(R.assoc('variant', propVariant.ICON_COMPACT)),
    R.filter(R.prop('draggable'))
  )(props)
  const layout = {
    type: layoutType.GRID,
    numRows: Math.ceil(R.keys(globalOutputs).length / 3),
    minColumnWidth: 'min-content',
  }
  return (
    <Box sx={style}>
      {renderPropsLayout({
        layout,
        items: globalOutputs,
        onChangeProp: () => null,
      })}
    </Box>
  )
}

export default GlobalOutputsPad
