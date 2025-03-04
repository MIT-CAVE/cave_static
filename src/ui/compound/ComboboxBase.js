import { Autocomplete, TextField, IconButton } from '@mui/material'
import * as R from 'ramda'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Children,
  cloneElement,
} from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  setIsOpen,
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
  setIsTextArea,
} from '../../data/utilities/virtualKeyboardSlice'

import { forceArray } from '../../utils'

const DELAY = 10
const KEYBOARD_LAYOUT = 'default'

const ComboboxBase = ({
  disabled,
  multiple,
  placeholder,
  options,
  value: defaultValue,
  limitTags,
  sx = [],
  slotProps,
  getOptionLabel,
  onChange,
  ...props
}) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)
  const focused = useRef(false)

  const [value, setValue] = useState(defaultValue ?? (multiple ? [] : ''))
  const [justFocused, setJustFocused] = useState(false)

  const valueName = multiple ? '' : getOptionLabel(value)
  const [valueText, setValueText] = useState(valueName)

  useEffect(() => {
    if (focused.current && virtualKeyboard.enter) {
      inputRef.current.blur()
      dispatch(setIsOpen(false))
      dispatch(setEnter(false))
    }
  }, [dispatch, virtualKeyboard.enter])

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setAllValues = useCallback(
    (inputValue) => {
      setValueText(inputValue)
      dispatch(setInputValue(inputValue))
      selfChanged.current = true
    },
    [dispatch]
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
  }, [disabled, multiple, valueText, virtualKeyboard.inputValue])

  // Keep cursor position synced with virtual keyboard's
  useEffect(() => {
    if (!focused.current) return

    if (
      inputRef.current &&
      !selfChanged.current &&
      !R.equals(virtualKeyboard.caretPosition, [
        inputRef.current.selectionStart,
        inputRef.current.selectionEnd,
      ])
    ) {
      inputRef.current.setSelectionRange(
        virtualKeyboard.caretPosition[0],
        virtualKeyboard.caretPosition[1]
      )
    }

    if (selfChanged.current) {
      selfChanged.current = false
    }
  }, [virtualKeyboard.caretPosition, virtualKeyboard.inputValue, valueText])

  const syncCaretPosition = () => {
    if (inputRef.current.selectionStart === inputRef.current.selectionEnd) {
      dispatch(
        setCaretPosition([
          inputRef.current.selectionStart,
          inputRef.current.selectionStart,
        ])
      )
      selfChanged.current = true
    }
  }

  // Delay update from focus to here so that focusing via
  // clicking the clear button can correctly clear text
  useEffect(() => {
    if (justFocused) {
      setJustFocused(false)
      setAllValues(valueName)
    }
  }, [justFocused, setAllValues, valueName])

  // NOTE: Need this workaround as duplicate combobox props
  // aren't re-rendered when `value`|`defaultValue` changes
  useEffect(() => {
    setValue(defaultValue)
    setAllValues(valueName)
  }, [defaultValue, setAllValues, valueName])

  const addAdornment = (adornment) => {
    const children = Children.toArray(adornment.props.children)
    children.unshift(
      <IconButton
        key="virtual-kb"
        size="small"
        onClick={() => {
          if (!focused.current) {
            inputRef.current.focus()
            inputRef.current.setSelectionRange(value.length, value.length)
          }

          dispatch(setIsOpen(!virtualKeyboard.isOpen))
          dispatch(setLayout(KEYBOARD_LAYOUT))
          syncCaretPosition()
        }}
        onMouseDown={(event) => {
          if (focused.current) event.preventDefault()
        }}
      >
        <BiSolidKeyboard />
      </IconButton>
    )
    return cloneElement(adornment, {}, children)
  }

  return (
    <Autocomplete
      {...{ disabled, multiple, options, value, limitTags }}
      fullWidth
      disablePortal
      sx={[{ p: 1.5 }, ...forceArray(sx)]}
      inputValue={valueText}
      renderInput={({ InputProps, ...params }) => (
        // The placeholder in the API serves as a label in the context of the MUI component.
        <TextField
          fullWidth
          label={placeholder}
          {...params}
          onSelect={syncCaretPosition}
          inputRef={inputRef}
          slotProps={{
            ...slotProps,
            input: {
              ...InputProps,
              ...(!disabled && {
                endAdornment: addAdornment(InputProps.endAdornment),
              }),
              ...slotProps?.input,
            },
          }}
        />
      )}
      onInputChange={(event, newInputValue, reason) => {
        if (reason === 'input') {
          // avoid infinite loop when loading component
          setAllValues(newInputValue)
        }
      }}
      onChange={(event, newValue) => {
        if (disabled) return
        onChange(multiple ? newValue : [newValue])
        setValue(newValue)
        if (!multiple) setAllValues(getOptionLabel(newValue))
      }}
      onFocus={() => {
        if (disabled) return

        // delay to ensure the keyboard closing is overriden
        // if user focuses to another input field
        if (virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(true))
            dispatch(setLayout(KEYBOARD_LAYOUT))
          }, DELAY)
        }

        focused.current = true
        setJustFocused(true)
      }}
      onBlur={() => {
        if (disabled) return

        // delay so that focusing to another input field keeps
        // the keyboard open
        if (virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(false))
          }, DELAY)
        }

        setAllValues(valueName)
        focused.current = false
        dispatch(setIsTextArea(false))
      }}
      onTouchStart={() => {
        if (disabled) return

        isTouchDragging.current = false
      }}
      onTouchMove={() => {
        if (disabled) return

        isTouchDragging.current = true
      }}
      onTouchEnd={() => {
        if (disabled) return

        // delay so that clicking on the keyboard button doesn't immediately
        // close the keyboard due to onClick event
        if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(true))
            dispatch(setLayout(KEYBOARD_LAYOUT))
          }, DELAY)
        }
      }}
      {...{ getOptionLabel, ...props }}
    />
  )
}

export default ComboboxBase
