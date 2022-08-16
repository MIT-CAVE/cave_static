import { Backdrop, CircularProgress } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'

import { selectIgnoreLoading } from '../../../data/selectors'

const useStyles = makeStyles(() => ({
  backdrop: {
    zIndex: 2000,
    color: '#fff',
  },
}))

const Loader = () => {
  const open = useSelector(selectIgnoreLoading)
  const classes = useStyles()
  return (
    <Backdrop className={classes.backdrop} open={open}>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

export default Loader
