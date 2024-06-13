import { Autocomplete, Box, TextField, InputAdornment } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  toggleKeyboard,
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

const PropComboBox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)
  const focused = useRef(false)

  const { enabled = false, options, placeholder } = prop
  const [value, setValue] = useState(R.defaultTo(prop.value, currentVal))
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)

  const valueName = useMemo(
    () => indexedOptions[value]?.['name'],
    [indexedOptions, value]
  )
  const [valueText, setValueText] = useState(valueName)

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setAllValues = (inputValue) => {
    setValueText(inputValue)
    dispatch(setInputValue(inputValue))
    selfChanged.current = true
  }

  // Update this field's value when user types on virtual keyboard
  useEffect(() => {
    if (
      !enabled ||
      !focused.current ||
      virtualKeyboard.inputValue === valueText
    )
      return

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

  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Autocomplete
        fullWidth
        // {...{ value }}
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
                        dispatch(toggleKeyboard())
                        dispatch(setLayout('default'))
                        syncCaretPosition()
                      }}
                      onMouseDown={(event) => event.preventDefault()}
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

          setAllValues(R.defaultTo('', valueName))
          focused.current = true
        }}
        onBlur={() => {
          if (!enabled) return

          if (virtualKeyboard.isOpen) {
            dispatch(toggleKeyboard())
          }

          setAllValues(R.defaultTo('', valueName))
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

          if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
            dispatch(toggleKeyboard())
            dispatch(setLayout('default'))
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
