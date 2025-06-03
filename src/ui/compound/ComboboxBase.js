import { Autocomplete, TextField, IconButton } from '@mui/material'
import * as R from 'ramda'
import { useState, useEffect, useCallback, Children, cloneElement } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch } from 'react-redux'

import { setInputValue } from '../../data/utilities/virtualKeyboardSlice'
import { useVirtualKeyboard } from '../views/common/useVirtualKeyboard'

const ComboboxBase = ({
  disabled,
  readOnly,
  multiple,
  placeholder,
  options,
  value: defaultValue,
  limitTags,
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  sx = [],
  slotProps,
  getOptionLabel,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue ?? (multiple ? [] : ''))
  const [justFocused, setJustFocused] = useState(false)
  const valueName = multiple ? '' : getOptionLabel(value)
  const [valueText, setValueText] = useState(valueName)
  const dispatch = useDispatch()

  const {
    inputRef,
    virtualKeyboard,
    focused,
    isInternalChange,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyboardToggle,
    handleKeyboardMouseDown,
    handleSelectionChange,
  } = useVirtualKeyboard({
    keyboardLayout: 'default',
    disabled,
    onBlur: () => {
      // component-specific blur logic
      setKeyboardValue(valueName)
    },
    onFocus: () => {
      // component-specific focus logic
      setJustFocused(true)
    },
  })

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setKeyboardValue = useCallback(
    (inputValue) => {
      setValueText(inputValue)
      dispatch(setInputValue(inputValue))
      isInternalChange.current = true
    },
    [dispatch, isInternalChange]
  )

  // Update this field's value when user types on virtual keyboard
  useEffect(() => {
    if (
      disabled ||
      !focused.current ||
      virtualKeyboard.inputValue === valueText
    )
      return

    if (virtualKeyboard.inputValue === '') {
      setValue(R.unless(R.always(multiple), R.always('')))
    }

    setValueText(virtualKeyboard.inputValue)
  }, [disabled, focused, multiple, valueText, virtualKeyboard.inputValue])

  // Delay update from focus to here so that focusing via
  // clicking the clear button can correctly clear text
  useEffect(() => {
    if (justFocused) {
      setJustFocused(false)
      setKeyboardValue(valueName)
    }
  }, [justFocused, setKeyboardValue, valueName])

  // NOTE: Need this workaround as duplicate combobox props
  // aren't re-rendered when `value`|`defaultValue` changes
  useEffect(() => {
    setValue(defaultValue)
    setKeyboardValue(valueName)
  }, [defaultValue, setKeyboardValue, valueName])

  const addAdornment = useCallback(
    (adornment) => {
      const children = Children.toArray(adornment.props.children)
      children.unshift(
        <IconButton
          key="virtual-kb"
          size="small"
          onClick={handleKeyboardToggle}
          onMouseDown={handleKeyboardMouseDown}
        >
          <BiSolidKeyboard />
        </IconButton>
      )
      return cloneElement(adornment, {}, children)
    },
    [handleKeyboardMouseDown, handleKeyboardToggle]
  )

  const handleInputChange = useCallback(
    (event, newInputValue, reason) => {
      if (reason === 'input') {
        // avoid infinite loop when loading component
        setKeyboardValue(newInputValue)
      }
    },
    [setKeyboardValue]
  )

  const handleChange = useCallback(
    (event, newValue) => {
      if (disabled) return
      onChange(multiple ? newValue : [newValue])
      setValue(newValue)
      if (!multiple) setKeyboardValue(getOptionLabel(newValue))
    },
    [disabled, getOptionLabel, multiple, onChange, setKeyboardValue]
  )

  return (
    <Autocomplete
      disablePortal
      inputValue={valueText}
      {...{
        disabled,
        multiple,
        options,
        value,
        limitTags,
        sx,
        fullWidth,
        getOptionLabel,
      }}
      renderInput={({ InputProps, ...params }) => (
        // The placeholder in the API serves as a label in the context of the MUI component.
        <TextField
          label={placeholder}
          {...{ inputRef, fullWidth, ...params }}
          onSelect={handleSelectionChange}
          slotProps={{
            ...slotProps,
            input: {
              ...InputProps,
              ...(!(disabled || readOnly) && {
                endAdornment: addAdornment(InputProps.endAdornment),
              }),
              ...slotProps?.input,
            },
          }}
        />
      )}
      onInputChange={handleInputChange}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
}

export default ComboboxBase
