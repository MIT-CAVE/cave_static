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
import { useId } from 'react'

import Spinner, {
  SpinnerDecreaseButton,
  SpinnerIncreaseButton,
} from './Spinner'

import { forceArray, getStatusIcon, NumberFormat } from '../../utils'

const styles = {
  adornment: {
    maxHeight: 'unset',
    alignSelf: 'stretch',
  },
  spinnerButton: {
    borderColor: 'divider',
    bgcolor: 'grey.700',
  },
}

const NumberField = ({
  id: idProp,
  name,
  disabled,
  error,
  readOnly,
  label,
  placeholder,
  value,
  min,
  max,
  numberFormat: numberFormatRaw,
  color = 'default',
  helperText,
  sx = [],
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  size = 'medium',
  endAdornments,
  slotProps,
  spinner = 'right',
  decreaseIcon,
  increaseIcon,
  statusIcon,
  onChange,
  onChangeCommitted,
  ...rest
}) => {
  let id = useId()
  if (idProp) {
    id = idProp
  }

  const handleValueChange = (newValue, event) => {
    const clampedValue = Math.min(max, Math.max(min, newValue))
    if (disabled || readOnly || value === clampedValue) return

    onChange(event, clampedValue)
  }

  const handleValueCommitted = (newValue, event) => {
    if (disabled || readOnly) return

    const clampedValue = Math.min(max, Math.max(min, newValue))
    onChangeCommitted(event, clampedValue)
  }

  return (
    <Field.Root
      {...{ name }}
      render={(props) => (
        <FormControl
          ref={props.ref}
          {...{ disabled, error, size, fullWidth, sx }}
          variant="outlined"
        >
          {props.children}
        </FormControl>
      )}
    >
      <BaseNumberField.Root
        onValueChange={handleValueChange}
        onValueCommitted={onChangeCommitted ? handleValueCommitted : undefined}
        {...{ value, min, max, readOnly, ...rest }}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        <InputLabel htmlFor={id}>{label}</InputLabel>
        <BaseNumberField.Input
          render={(props, state) => {
            // Here, units are excluded from `format` as
            // they are rendered in the prop container
            // eslint-disable-next-line no-unused-vars
            const { unit, unitPlacement, ...numberFormat } = numberFormatRaw
            const formattedValue = NumberFormat.format(
              state.value,
              numberFormat
            )
            const inputRef = props.ref
            return (
              <OutlinedInput
                {...{
                  id,
                  inputRef,
                  label,
                  color,
                  placeholder,
                  readOnly,
                  fullWidth,
                }}
                value={state.inputValue}
                sx={[
                  spinner === 'left' && { pl: 0 },
                  spinner === 'right' && { pr: 0 },
                  spinner === 'leftAndRight' && { px: 0 },
                ]}
                slotProps={{
                  ...slotProps,
                  input: {
                    ...props,
                    // Display the formatted value using our `NumberFormat.format` function
                    value: state.focused ? state.value : formattedValue,
                    ...slotProps?.input,
                    sx: [
                      spinner === 'leftAndRight' && { textAlign: 'center' },
                      ...forceArray(slotProps?.input?.sx),
                    ],
                  },
                }}
                startAdornment={
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
                        {...{ decreaseIcon, increaseIcon }}
                      />
                    ) : spinner === 'leftAndRight' ? (
                      <SpinnerDecreaseButton
                        // {...{ size }}
                        icon={decreaseIcon}
                        sx={[
                          {
                            borderRight: '1px solid',
                            // boxShadow: 'inset -1px 0 0 rgb(255 255 255 / .12)',
                          },
                          size === 'medium' && { px: 1.5 },
                          styles.spinnerButton,
                        ]}
                      />
                    ) : null}
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment
                    position="end"
                    sx={[
                      spinner && styles.adornment,
                      spinner === 'right' && { ml: '14px' },
                    ]}
                  >
                    {endAdornments}
                    {spinner === 'right' || spinner === true ? (
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
                            borderLeft: '1px solid',
                            // boxShadow: 'inset 1px 0 0 rgb(255 255 255 / .12)',
                          },
                          size === 'medium' && { px: 1.5 },
                          styles.spinnerButton,
                        ]}
                      />
                    ) : null}
                    {color !== 'default' && statusIcon && getStatusIcon(color)}
                  </InputAdornment>
                }
                onChange={props.onChange}
                onSelect={props.onSelect}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                onTouchStart={props.onTouchStart}
                onTouchMove={props.onTouchMove}
                onTouchEnd={props.onTouchEnd}
                onKeyUp={props.onKeyUp}
                onKeyDown={props.onKeyDown}
              />
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
  slotProps: PropTypes.object,
}

export default NumberField
