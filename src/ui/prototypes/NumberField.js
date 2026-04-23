// Hybrid prototype (Base UI + MUI) for CAVE's next Design System,
// intended to be built purely on Base UI (release target: v5+)
import { Field } from '@base-ui/react/field'
import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import {
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback, useId, useRef } from 'react'
import { useDispatch } from 'react-redux'

import Spinner, {
  SpinnerDecreaseButton,
  SpinnerIncreaseButton,
} from './Spinner'

import {
  setCaretPosition,
  setInputValue as SetKeyboardInputValue,
} from '../../data/utilities/virtualKeyboardSlice'
import KeyboardToggle from '../compound/KeyboardToggle'
import OverflowText from '../compound/OverflowText'

import { forceArray, getStatusIcon, NumberFormat } from '../../utils'

const styles = {
  inputComponent: {
    position: 'relative',
  },
  notched: {
    '& .MuiOutlinedInput-notchedOutline > legend': {
      maxWidth: 'calc(100% - 64px)',
    },
  },
  notchedAlt: {
    '& .MuiOutlinedInput-notchedOutline > legend': {
      maxWidth: 'calc(100% - 32px)',
    },
  },
  adornment: {
    maxHeight: 'unset',
    alignSelf: 'stretch',
  },
  spinnerButton: {
    // borderColor: 'divider',
    bgcolor: 'grey.700',
  },
}

// const setRef = (ref, node) => {
//   if (typeof ref === 'function') {
//     ref(node)
//   } else if (ref) {
//     ref.current = node
//   }
// }

const NumberField = ({
  id: idProp,
  name,
  disabled = false,
  error,
  readOnly = false,
  label,
  placeholder,
  value,
  defaultValue,
  min = -Infinity,
  max = Infinity,
  numberFormat: numberFormatRaw,
  step,
  smallStep = numberFormatRaw.precision
    ? // Setting `smallStep` to a maximum of 3 decimal places `precision`
      // is a safeguard against a bug in Base UI's `NumberField` where the
      // spinner doesn't work for smaller step values (e.g. `0.0001`).
      1 / 10 ** Math.min(3, numberFormatRaw.precision)
    : undefined,
  largeStep,
  color = 'default',
  helperText,
  marqueeLabel = true,
  sx = [],
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  size = 'medium',
  spinner = 'right',
  decreaseIcon,
  increaseIcon,
  statusIcon,
  hideKeyboardToggle = false,
  endAdornments,
  slotProps,
  onChange,
  onChangeCommitted,
  ...rest
}) => {
  let id = useId()
  if (idProp) {
    id = idProp
  }
  const kbRef = useRef(null)
  const localInputRef = useRef(null)
  const dispatch = useDispatch()

  const getCombinedRef = useCallback(
    (baseInputRef) => (node) => {
      localInputRef.current = node
      baseInputRef(node)
    },
    []
  )

  const handleValueChange = (newValue, event) => {
    // if (disabled || readOnly) return // REVIEW: Is this check necessary?

    // Workaround to update virtual keyboard's value when this field changes from virtual keyboard input
    if (event?.type === 'onvirtualkeydown') {
      // Clamp value from virtual keyboard within min/max bounds
      newValue = Math.min(max, Math.max(min, Number(newValue)))

      // console.log('Virtual keyboard change', { value, newValue, event })
      dispatch(SetKeyboardInputValue(`${newValue}`))
      dispatch(
        setCaretPosition([
          localInputRef.current.selectionStart,
          localInputRef.current.selectionStart,
        ])
      )
    }
    if (value === newValue) return

    onChange(event, newValue)
  }

  const handleValueCommitted = (newValue, event) => {
    // if (disabled || readOnly) return // REVIEW: Is this check necessary?
    onChangeCommitted(event, newValue)
  }

  const showKeyboardToggle = !(hideKeyboardToggle || readOnly || disabled)
  const shouldShiftKeyboardToggle =
    showKeyboardToggle && (!spinner || spinner === 'left')
  const controlled = defaultValue === undefined
  return (
    <Field.Root
      {...{ name }}
      render={(props, state) => (
        <FormControl
          ref={props.ref}
          {...{ disabled, error, size, fullWidth, sx }}
          // `focused` is required to apply color to the input.
          // Otherwise, it remains uncolored when blurred.
          focused={
            color !== 'default' || (state.focused && kbRef.current?.isOpen)
          }
          variant="outlined"
        >
          {props.children}
        </FormControl>
      )}
    >
      <BaseNumberField.Root
        onValueChange={controlled ? handleValueChange : undefined}
        onValueCommitted={onChangeCommitted ? handleValueCommitted : undefined}
        {...{
          value,
          defaultValue,
          min,
          max,
          step,
          smallStep,
          largeStep,
          readOnly,
          ...rest,
        }}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        <InputLabel
          htmlFor={id}
          {...{ color, ...slotProps?.label }}
          sx={[
            // Leave room for keyboard toggler
            showKeyboardToggle && spinner && { maxWidth: 'calc(133% - 118px)' },
            shouldShiftKeyboardToggle && { maxWidth: 'calc(133% - 72px)' },
            ...forceArray(slotProps?.label?.sx),
          ]}
        >
          {marqueeLabel ? <OverflowText text={label} /> : label}
        </InputLabel>
        <BaseNumberField.Input
          id={id}
          render={(props, state) => {
            // Here, units are excluded from `format` as
            // they are rendered in the prop container
            // eslint-disable-next-line no-unused-vars
            const { unit, unitPlacement, ...numberFormat } = numberFormatRaw
            return (
              <>
                <OutlinedInput
                  inputRef={getCombinedRef(props.ref)}
                  color={
                    color === 'default' &&
                    state.focused &&
                    kbRef.current?.isOpen
                      ? 'primary'
                      : color
                  }
                  {...{
                    label,
                    placeholder,
                    readOnly,
                    fullWidth,
                  }}
                  value={state.inputValue}
                  sx={[
                    styles.inputComponent,
                    showKeyboardToggle && spinner && styles.notched,
                    shouldShiftKeyboardToggle && styles.notchedAlt,
                    spinner === 'left' && { pl: 0 },
                    spinner === 'right' && { pr: 0 },
                    spinner === 'leftAndRight' && { px: 0 },
                  ]}
                  slotProps={{
                    ...slotProps,
                    input: {
                      ...props,
                      disabled,
                      value: state.focused
                        ? state.value
                        : // Show formatted value when input is blurred
                          NumberFormat.format(state.value, numberFormat),
                      ...slotProps?.input,
                      sx: [
                        spinner === 'leftAndRight' && { textAlign: 'center' },
                        ...forceArray(slotProps?.input?.sx),
                      ],
                    },
                  }}
                  startAdornment={
                    spinner &&
                    !disabled && (
                      <InputAdornment
                        position="start"
                        sx={[
                          spinner && styles.adornment,
                          spinner === 'left' && { mr: '14px' },
                        ]}
                      >
                        {spinner === 'left' ? (
                          <Spinner
                            side="left"
                            {...{ disabled, decreaseIcon, increaseIcon }}
                          />
                        ) : spinner === 'leftAndRight' ? (
                          <SpinnerDecreaseButton
                            {...{ disabled }}
                            icon={decreaseIcon}
                            // {...{ size }}
                            sx={[
                              {
                                // borderRight: '1px solid',
                                boxShadow:
                                  'inset -1px 0 0 rgb(255 255 255 / .12)',
                              },
                              size === 'medium' && { px: 1.5 },
                              styles.spinnerButton,
                            ]}
                          />
                        ) : null}
                      </InputAdornment>
                    )
                  }
                  endAdornment={
                    <InputAdornment
                      position="end"
                      sx={[
                        spinner && !disabled && styles.adornment,
                        spinner === 'right' && !disabled && { ml: '14px' },
                      ]}
                    >
                      {endAdornments}
                      {!disabled &&
                        (spinner === 'right' || spinner === true ? (
                          <Spinner
                            side="right"
                            {...{ decreaseIcon, increaseIcon }}
                          />
                        ) : spinner === 'leftAndRight' ? (
                          <SpinnerIncreaseButton
                            icon={increaseIcon}
                            // {...{ size }}
                            sx={[
                              {
                                // borderLeft: '1px solid',
                                boxShadow:
                                  'inset 1px 0 0 rgb(255 255 255 / .12)',
                              },
                              size === 'medium' && { px: 1.5 },
                              styles.spinnerButton,
                            ]}
                          />
                        ) : null)}
                      {color !== 'default' &&
                        statusIcon &&
                        getStatusIcon(color)}
                    </InputAdornment>
                  }
                  onChange={kbRef.current?.handleChange}
                  onSelect={props.onSelect}
                  onFocus={kbRef.current?.handleFocus}
                  onBlur={kbRef.current?.handleBlur}
                  onTouchStart={kbRef.current?.handleTouchStart}
                  onTouchMove={kbRef.current?.handleTouchMove}
                  onTouchEnd={kbRef.current?.handleTouchEnd}
                  onKeyUp={props.onKeyUp}
                  onKeyDown={props.onKeyDown}
                />
                {showKeyboardToggle && (
                  <KeyboardToggle
                    ref={kbRef}
                    {...{ disabled }}
                    inputRef={localInputRef}
                    inputId={id}
                    keyboardLayout="numPad"
                    focused={state.focused}
                    unformattedValue={state.inputValue}
                    sx={shouldShiftKeyboardToggle && { right: '8px' }}
                    setInputValue={handleValueChange}
                    onChange={props.onChange}
                    onFocus={props.onFocus}
                    onBlur={props.onBlur}
                    onTouchStart={props.onTouchStart}
                    onTouchMove={props.onTouchMove}
                    onTouchEnd={props.onTouchEnd}
                  />
                )}
              </>
            )
          }}
        />
        <FormHelperText sx={{ ml: 0, '&:empty': { mt: 0 } }}>
          {helperText}
        </FormHelperText>
      </BaseNumberField.Root>
    </Field.Root>
  )
}

NumberField.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  marqueeLabel: PropTypes.bool,
  spinner: PropTypes.oneOf([false, true, 'right', 'left', 'leftAndRight']),
  error: PropTypes.bool,
  size: PropTypes.oneOf(['medium', 'small']),
  onClickAway: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  smallStep: PropTypes.number,
  largeStep: PropTypes.number,
  numberFormat: PropTypes.object,
  color: PropTypes.string,
  helperText: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  fullWidth: PropTypes.bool,
  endAdornments: PropTypes.node,
  decreaseIcon: PropTypes.node,
  increaseIcon: PropTypes.node,
  statusIcon: PropTypes.bool,
  hideKeyboardToggle: PropTypes.bool,
  slotProps: PropTypes.object,
}

export default NumberField
