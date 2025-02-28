import { colord } from 'colord'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useCallback, useMemo, useState, useRef } from 'react'

export const useColorPicker = (onChangeColor) => {
  const [colorPickerProps, setColorPickerProps] = useState({})
  const setColorTimeout = useRef(-1)

  const handleChange = useCallback(
    (value, colorOutputs, pathTail = colorPickerProps.key) => {
      setColorPickerProps(R.assoc('value', value))
      if (!matchIsValidColor(value)) return
      if (setColorTimeout.current !== -1) clearTimeout(setColorTimeout.current)
      setColorTimeout.current = setTimeout(() => {
        onChangeColor(pathTail)(value)
        setColorTimeout.current = -1
      }, 500)
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

const ColorPicker = ({ colorLabel, value, onChange }) => {
  const formattedColor = useMemo(() => {
    if (!matchIsValidColor(value)) return value
    const rawHex = colord(value).toHex()
    return rawHex.length > 7 ? rawHex : `${rawHex}ff`
  }, [value])

  return (
    <MuiColorInput
      // size="small"
      fullWidth
      focused
      color="warning"
      format="hex8"
      // PopoverProps={{ onClose }}
      value={formattedColor}
      label={`Color \u279D ${colorLabel}`}
      style={{ marginTop: '20px', flex: '1 1 auto' }}
      slotProps={{ input: { style: { borderRadius: 0 } } }}
      {...{ onChange }}
    />
  )
}

export default ColorPicker
