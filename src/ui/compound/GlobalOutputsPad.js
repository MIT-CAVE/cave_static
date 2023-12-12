import { Box } from '@mui/material'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectMergedGlobalOutputs } from '../../data/selectors'
import { layoutType, propVariant } from '../../utils/enums'
import { renderPropsLayout } from '../views/common/renderLayout'

import { addValuesToProps } from '../../utils'

const style = {
  p: 1.5,
  bgcolor: 'background.paper',
  borderRadius: 1,
}

const GlobalOutputsPad = () => {
  const items = useSelector(selectMergedGlobalOutputs)
  const props = addValuesToProps(
    R.map(R.assoc('enabled', false))(R.propOr({}, 'props', items)),
    R.propOr({}, 'values', items)
  )
  const layout = {
    type: layoutType.GRID,
    numRows: Math.ceil(props.length / 3),
    minColumnWidth: 'min-content',
  }
  return (
    <Box sx={style}>
      {renderPropsLayout({
        layout,
        items: R.map(R.assoc('variant', propVariant.ICON_COMPACT))(props),
        onChangeProp: () => null,
      })}
    </Box>
  )
}

export default GlobalOutputsPad
