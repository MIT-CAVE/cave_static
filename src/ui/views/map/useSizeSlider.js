import * as R from 'ramda'
import { useCallback, useState } from 'react'

const useSizeSlider = (onChangeSize) => {
  const [sizeSliderProps, setSizeSliderProps] = useState({})

  const handleOpen = useCallback(
    (key, value) => () => {
      setSizeSliderProps(
        key === sizeSliderProps.key ? {} : { key, value: [parseInt(value)] }
      )
    },
    [sizeSliderProps.key]
  )

  const handleChange = useCallback((event, value) => {
    setSizeSliderProps(R.assoc('value', value))
  }, [])

  const handleChangeComitted = useCallback(
    (event, value) => {
      onChangeSize(sizeSliderProps.key)(value[0])
    },
    [onChangeSize, sizeSliderProps.key]
  )

  const handleClose = useCallback((event) => {
    setSizeSliderProps({})
    event.stopPropagation()
  }, [])

  return {
    sizeSliderProps,
    showSizeSlider: R.isNotEmpty(sizeSliderProps),
    handleOpen,
    handleClose,
    handleChange,
    handleChangeComitted,
  }
}

export default useSizeSlider
