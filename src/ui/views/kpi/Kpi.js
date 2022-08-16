import { Box } from '@mui/material'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectKpis } from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { renderKpisLayout } from '../common/renderLayout'


const styles = {
  root: (theme) => ({
    height: `calc(100vh - ${theme.spacing(5)})`,
    width: `calc(100vw - ${APP_BAR_WIDTH + 1}px - ${theme.spacing(5)})`,
    p: 2.5,
    color: 'text.primary',
  }),
  scrollArea: (props) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    overflow: 'auto',
  }),
  layoutWrapper: {
    minWidth: 'max-content',
    width: 'fit-content',
  },
}

const Kpi = ({ ...props }) => {
  const { layout, data } = useSelector(selectKpis)
  return (
    <Box sx={styles.root} {...props}>
      <Box sx={styles.scrollArea}>
        <Box sx={styles.layoutWrapper}>
          {renderKpisLayout({
            layout,
            items: R.reject(R.prop('map_kpi'))(data), // Exclude map KPIs
            onChangeProp: () => {},
          })}
        </Box>
      </Box>
    </Box>
  )
}

export default Kpi
