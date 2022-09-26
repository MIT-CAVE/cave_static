import { Box } from '@mui/material'
import { useSelector } from 'react-redux'

import { selectKpisLayout, selectMergedKpis } from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { renderKpisLayout } from '../common/renderLayout'

const style = (theme) => ({
  height: `calc(100vh - ${theme.spacing(5)})`,
  maxWidth: `calc(100vw - ${APP_BAR_WIDTH + 1}px - ${theme.spacing(5)})`,
  p: 2.5,
  color: 'text.primary',
  overflow: 'auto',
  display: 'grid',
  placeItems: 'center',
})

const Kpi = ({ ...props }) => {
  const layout = useSelector(selectKpisLayout)
  const items = useSelector(selectMergedKpis)
  return (
    <Box sx={style} {...props}>
      <Box sx={{ width: 'min-content' }}>
        {renderKpisLayout({ layout, items })}
      </Box>
    </Box>
  )
}

export default Kpi
