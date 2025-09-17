import {
  Autocomplete,
  Chip,
  IconButton,
  Stack,
  TextField,
  autocompleteClasses,
} from '@mui/material'
import * as R from 'ramda'
import { useState, useEffect, useCallback, Children, cloneElement } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'
import { useDispatch } from 'react-redux'

import FetchedIcon from './FetchedIcon'

import { setInputValue } from '../../data/utilities/virtualKeyboardSlice'
import { useVirtualKeyboard } from '../views/common/useVirtualKeyboard'

import { getContrastText } from '../../utils'

const DEFAULT_SIZE = '18px'

const styles = {
  getChip: ({ activeColor, contrastText }) => ({
    bgcolor: activeColor,
    '.MuiChip-label, .MuiChip-deleteIcon': {
      color: contrastText,
      opacity: 0.7,
    },
  }),
}

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const getCurrentAttr = (value, attr, activeAttr) =>
  value ? getOrDefault(activeAttr, attr) : attr

const ComboboxBase = ({
  disabled,
  readOnly,
  multiple,
  placeholder,
  options,
  indexedOptions,
  value: defaultValue,
  limitTags,
  labelPlacement,
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  sx = [],
  slotProps,
  endAdornments,
  startAdornments,
  getActiveAttrs,
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

  const addEndAdornment = useCallback(
    (adornment) => {
      const children = Children.toArray(adornment.props.children)
      children.unshift(
        endAdornments,
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
    [endAdornments, handleKeyboardMouseDown, handleKeyboardToggle]
  )

  const renderOption = useCallback(
    (props, option) => {
      const { key, ...optionProps } = props
      const {
        icon,
        name,
        color,
        size,
        activeIcon,
        activeName,
        activeColor,
        activeSize,
      } = indexedOptions[option] ?? {}

      const direction =
        labelPlacement === 'start'
          ? 'row-reverse'
          : labelPlacement === 'end'
            ? 'row'
            : ''

      const selected = option === value
      const currentLabel = getCurrentAttr(selected, name, activeName)
      const currentIcon = getCurrentAttr(selected, icon, activeIcon)
      const currentColor = getCurrentAttr(selected, color, activeColor)
      const currentSize = getCurrentAttr(selected, size, activeSize)

      const markerStyle = {
        verticalAlign: 'middle',
        margin: '0 4px',
        ...(activeIcon && { border: '1px outset #fff' }),
        ...(labelPlacement === 'start' && { margin: '0 8px' }),
      }

      return (
        <Stack
          key={key}
          useFlexGap
          spacing={1}
          {...{ direction }}
          sx={{
            borderRadius: '8px',
            margin: '5px',
            [`&.${autocompleteClasses.option}`]: {
              padding: '8px',
            },
          }}
          component="li"
          {...optionProps}
        >
          {currentIcon ? (
            <FetchedIcon
              iconName={currentIcon}
              color={currentColor}
              size={currentSize ?? DEFAULT_SIZE}
              style={markerStyle}
            />
          ) : currentColor ? (
            <IoSquareSharp
              color={currentColor}
              size={currentSize ?? DEFAULT_SIZE}
              style={markerStyle}
            />
          ) : currentSize ? (
            <GiEmptyChessboard
              size={currentSize ?? DEFAULT_SIZE}
              style={markerStyle}
            />
          ) : null}
          {currentLabel ?? option}
        </Stack>
      )
    },
    [indexedOptions, labelPlacement, value]
  )

  const renderInput = useCallback(
    ({ InputProps, ...params }) => (
      // The placeholder in the API serves as a label in the context of the MUI component.
      <TextField
        label={placeholder}
        {...{ inputRef, fullWidth, ...params }}
        onSelect={handleSelectionChange}
        slotProps={{
          ...slotProps,
          input: {
            ...InputProps,
            ...(!disabled && {
              startAdornment: (
                <>
                  {startAdornments}
                  {InputProps.startAdornment}
                </>
              ),
            }),
            ...(!(disabled || readOnly) && {
              endAdornment: addEndAdornment(InputProps.endAdornment),
            }),
            ...slotProps?.input,
          },
        }}
      />
    ),
    [
      addEndAdornment,
      disabled,
      fullWidth,
      handleSelectionChange,
      inputRef,
      placeholder,
      readOnly,
      slotProps,
      startAdornments,
    ]
  )

  const renderValue = useCallback(
    (value, getItemProps) =>
      value.map((option, index) => {
        const itemProps = getItemProps({ index })
        const opt = indexedOptions[option]
        const { activeIcon, activeSize, activeName, activeColor } =
          getActiveAttrs(opt)
        const contrastText = getContrastText(activeColor)
        return (
          <Chip
            key={option}
            {...(activeIcon && {
              icon: (
                <FetchedIcon
                  iconName={activeIcon}
                  color={contrastText}
                  size={activeSize ?? DEFAULT_SIZE}
                />
              ),
            })}
            label={activeName}
            sx={styles.getChip({ activeColor, contrastText })}
            {...R.dissoc('key')(itemProps)}
          />
        )
      }),
    [indexedOptions, getActiveAttrs]
  )

  const handleInputChange = useCallback(
    (event, newInputValue, reason) => {
      if (reason === 'input' || reason === 'clear') {
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
      // Prevents issues when the clear button is clicked and
      // `valueText` is temporarily `null` (since `setValueText`
      // is async and hasn't updated yet)
      inputValue={valueText ?? ''}
      {...{
        disabled,
        multiple,
        options,
        value,
        limitTags,
        fullWidth,
        sx,
        getOptionLabel,
        renderOption,
        renderInput,
        ...(multiple && { renderValue }), // `ComboboxMulti` only, for now
      }}
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
