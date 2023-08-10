import { Paper } from '@mui/material'
import * as R from 'ramda'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'

import { selectMapKpis } from '../../../data/selectors'
import { layoutType } from '../../../utils/enums'
import { renderKpisLayout } from '../common/renderLayout'

const getStyle = () => ({
  position: 'absolute',
  left: '10px',
  top: '10px',
  p: 1.5,
  bgcolor: 'background.paper',
  color: 'text.primary',
  borderBottom: 1,
  borderColor: 'text.secondary',
  borderRadius: 1,
  width: 'fit-content',
  zIndex: 1,
})

const KeyPad = () => {
  const mapKpis = useSelector(selectMapKpis)
  if (R.isEmpty(mapKpis)) return null

  const layout = {
    type: layoutType.GRID,
    numRows: Math.ceil(mapKpis.length / 3),
    minColumnWidth: 'min-content',
  }
  return (
    <Paper key="key-pad" elevation={7} sx={getStyle()}>
      {renderKpisLayout({ layout, items: mapKpis })}
    </Paper>
  )
}

export default memo(KeyPad)
