import { color } from 'd3-color'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'

export const useColorPicker = (onChangeColor) => {
  const [colorPickerProps, setColorPickerProps] = useState({})

  const handleChange = useCallback(
    (value) => {
      setColorPickerProps(R.assoc('value', value))
      onChangeColor(colorPickerProps.key)(value)
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
    return color(value).formatHex8().toLowerCase()
  }, [value])

  return (
    <MuiColorInput
      // size="small"
      focused
      color="warning"
      format="hex8"
      // PopoverProps={{ onClose }}
      label={`Color picker \u279D ${colorLabel}`}
      style={{ marginTop: '20px' }}
      value={formattedColor}
      {...{ onChange }}
    />
  )
}

export default ColorPicker
