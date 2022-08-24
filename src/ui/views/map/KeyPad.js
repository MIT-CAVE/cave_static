import { Paper } from '@mui/material'
import * as R from 'ramda'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectMapKpis,
  selectOpenPane,
  selectSecondaryOpenPane,
} from '../../../data/selectors'
import { PANE_WIDTH } from '../../../utils/constants'
import { layoutType } from '../../../utils/enums'
import { renderKpisLayout } from '../common/renderLayout'

const getStyle = (open, secondaryOpen) => ({
  position: 'absolute',
  left: 65 + (open ? PANE_WIDTH : 0) + (secondaryOpen ? PANE_WIDTH : 0),
  top: '10px',
  p: 1.5,
  bgcolor: 'background.paper',
  color: 'text.primary',
  borderBottom: 1,
  borderColor: 'text.secondary',
  borderRadius: '8px',
  width: 'fit-content',
  zIndex: 1,
})

const KeyPad = () => {
  const open = useSelector(selectOpenPane)
  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const mapKpis = useSelector(selectMapKpis)
  if (R.isEmpty(mapKpis)) return null

  const layout = {
    type: layoutType.GRID,
    num_rows: Math.ceil(mapKpis.length / 3),
    min_column_width: 'min-content',
  }
  return (
    <Paper key="key-pad" elevation={7} sx={getStyle(open, secondaryOpen)}>
      {renderKpisLayout({ layout, items: mapKpis })}
    </Paper>
  )
}

export default memo(KeyPad)
