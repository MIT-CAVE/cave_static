import * as R from 'ramda'
import { useCallback, useState } from 'react'

const useColorPicker = (onChangeColor) => {
  const [colorPickerProps, setColorPickerProps] = useState({})

  const handleChange = useCallback(
    (value, colorOutputs, pathEnd = colorPickerProps.key) => {
      setColorPickerProps(R.assoc('value', value))
      onChangeColor(pathEnd)(value)
    },
    [colorPickerProps, onChangeColor]
  )

  const handleOpen = useCallback(
    (key, value) => () => {
      setColorPickerProps(key === colorPickerProps.key ? {} : { key, value })
    },
    [colorPickerProps.key]
  )

  const handleClose = useCallback((event) => {
    setColorPickerProps({})
    event.stopPropagation()
  }, [])

  return {
    colorPickerProps,
    showColorPicker: R.isNotEmpty(colorPickerProps),
    handleOpen,
    handleClose,
    handleChange,
  }
}

export default useColorPicker
