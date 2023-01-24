import { Backdrop, CircularProgress } from '@mui/material'
import { useSelector } from 'react-redux'

import { selectShowLoading } from '../../../data/selectors'

const style = {
  color: '#fff',
  zIndex: 2000,
}

const Loader = () => {
  const open = useSelector(selectShowLoading)
  return (
    <Backdrop sx={style} open={open}>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

export default Loader
