import { Autocomplete, Box, TextField, InputAdornment } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
} from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  setIsOpen,
  setLayout,
  setInputValue,
  setCaretPosition,
} from '../../data/utilities/virtualKeyboardSlice'

import { withIndex, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  pt: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
  '& .MuiAutocomplete-root': {
    p: 1,
  },
})

const DELAY = 10
const KEYBOARD_LAYOUT = 'default'

const PropComboBox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)
  const focused = useRef(false)

  const { enabled = false, options, placeholder } = prop
  const [value, setValue] = useState(R.defaultTo(prop.value, currentVal))
  const [justFocused, setJustFocused] = useState(false)
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)

  const valueName = useMemo(
    () => R.defaultTo('', indexedOptions[value]?.['name']),
    [indexedOptions, value]
  )
  const [valueText, setValueText] = useState(valueName)

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
      !enabled ||
      !focused.current ||
      virtualKeyboard.inputValue === valueText
    )
      return

    if (virtualKeyboard.inputValue === '') {
      setValue(null)
    }

    setValueText(virtualKeyboard.inputValue)
  }, [setValueText, enabled, virtualKeyboard.inputValue, valueText])

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

  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Autocomplete
        fullWidth
        value={value}
        inputValue={valueText}
        sx={{ p: 1.5 }}
        disabled={!enabled}
        disablePortal
        options={R.pluck('id')(optionsListRaw)}
        renderInput={(params) => (
          // The placeholder in the API serves as a label in the context of the MUI component.
          <TextField
            fullWidth
            label={placeholder}
            {...params}
            onSelect={syncCaretPosition}
            inputRef={inputRef}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Fragment>
                  {params.InputProps.endAdornment}
                  <InputAdornment position="end">
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (!focused.current) {
                          inputRef.current.focus()
                          inputRef.current.setSelectionRange(
                            value.length,
                            value.length
                          )
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
                    </Box>
                  </InputAdornment>
                </Fragment>
              ),
            }}
          />
        )}
        onInputChange={(event, newInputValue, reason) => {
          if (reason === 'input') {
            // avoid infinite loop when loading component
            setAllValues(newInputValue)
          }
        }}
        onChange={(event, val) => {
          if (!enabled) return

          onChange([val])
          setValue(val)
          setAllValues(R.defaultTo('', indexedOptions[val]?.['name']))
        }}
        onFocus={() => {
          if (!enabled) return

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
          if (!enabled) return

          // delay so that focusing to another input field keeps
          // the keyboard open
          if (virtualKeyboard.isOpen) {
            setTimeout(() => {
              dispatch(setIsOpen(false))
            }, DELAY)
          }

          setAllValues(valueName)
          focused.current = false
        }}
        onTouchStart={() => {
          if (!enabled) return

          isTouchDragging.current = false
        }}
        onTouchMove={() => {
          if (!enabled) return

          isTouchDragging.current = true
        }}
        onTouchEnd={() => {
          if (!enabled) return

          // delay so that clicking on the keyboard button doesn't immediately
          // close the keyboard due to onClick event
          if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
            setTimeout(() => {
              dispatch(setIsOpen(true))
              dispatch(setLayout(KEYBOARD_LAYOUT))
            }, DELAY)
          }
        }}
        getOptionLabel={(option) =>
          R.pathOr(option, [option, 'name'])(indexedOptions)
        }
      />
    </Box>
  )
}
PropComboBox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropComboBox
