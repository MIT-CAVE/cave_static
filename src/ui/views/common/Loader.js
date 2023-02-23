import { Backdrop, CircularProgress } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectDataLoading,
  selectIgnoreLoading,
  selectSessionLoading,
} from '../../../data/selectors'

const style = {
  color: '#fff',
  zIndex: 2000,
}

const Loader = () => {
  const sessionLoading = useSelector(selectSessionLoading)
  const dataLoading = useSelector(selectDataLoading)
  const ignoreLoading = useSelector(selectIgnoreLoading)

  const waitTimeout = useRef(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // show for ignoreloading
    if (ignoreLoading) setOpen(true)
    // start a timer if other loadings
    else if (dataLoading || sessionLoading) {
      if (waitTimeout.current === 0)
        waitTimeout.current = setTimeout(() => setOpen(true), 250)
    } else {
      // if loadings false, clear timer
      if (waitTimeout.current !== 0) {
        clearTimeout(waitTimeout.current)
        waitTimeout.current = 0
      }
      // and close loader
      if (open) setOpen(false)
    }
    // cleanup timer on unmount
    return () => {
      if (waitTimeout.current !== 0) {
        clearTimeout(waitTimeout.current)
        waitTimeout.current = 0
      }
    }
  }, [dataLoading, ignoreLoading, open, sessionLoading])

  return (
    <Backdrop sx={style} open={open}>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

export default Loader
