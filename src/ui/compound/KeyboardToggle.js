import { IconButton, styled } from '@mui/material'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { TbKeyboardShow, TbKeyboardOff } from 'react-icons/tb'

import useVirtualKeyboard from '../views/common/useVirtualKeyboardAlt'

const KeyboardToggleRoot = styled(IconButton)(({ theme, color }) => ({
  position: 'absolute',
  right: '40px',
  top: '-9px',
  fontSize: '12px',
  padding: theme.spacing('1px', '5px', 0),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: '#535353',
  border: '1px solid',
  borderColor: theme.palette.divider,
  '&:hover': {
    backgroundColor: theme.palette.grey[700],
  },
  svg: {
    color: color === 'default' ? 'rgb(255 255 255 / 0.8)' : 'inherit',
  },
}))

const KeyboardToggle = forwardRef(
  (
    {
      disabled,
      // inputId,
      inputRef,
      sx,
      focused,
      keyboardLayout,
      unformattedValue,
      setInputValue,
      min,
      max,
      onChange,
      onFocus,
      onBlur,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    ref
  ) => {
    // TODO: Move this into the parent component and pass down the necessary props to avoid coupling `KeyboardToggle` with the virtual keyboard state management. This will make `KeyboardToggle` more reusable and easier to maintain.
    const {
      isOpen,
      // isInternalChange,
      handleKeyboardToggle,
      handleKeyboardMouseDown,
      handleChange,
      handleFocus,
      handleBlur,
      handleTouchMove,
      handleTouchStart,
      handleTouchEnd,
    } = useVirtualKeyboard({
      keyboardLayout,
      inputRef,
      disabled,
      focused,
      unformattedValue,
      min,
      max,
      onChange,
      onFocus,
      onBlur,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    })

    useEffect(() => {
      if (!focused) return
      const onVirtualKeyDown = (event) => {
        // console.log('Received onvirtualkeydown event', { event })
        if (event.detail?.value !== undefined) {
          setInputValue(event.detail.value, event)
          // onChange?.(event)
        }
      }

      window.addEventListener('onvirtualkeydown', onVirtualKeyDown)
      return () => {
        window.removeEventListener('onvirtualkeydown', onVirtualKeyDown)
      }
    }, [focused, setInputValue])

    // Get rid of this and just use the handlers from `useVirtualKeyboard` directly in the parent component. This will allow the parent component to have full control over the focus and touch handling logic, which is necessary for proper integration with the virtual keyboard.
    useImperativeHandle(
      ref,
      () => ({
        isOpen,
        handleChange,
        handleFocus,
        handleBlur,
        handleTouchMove,
        handleTouchStart,
        handleTouchEnd,
      }),
      [
        isOpen,
        handleChange,
        handleBlur,
        handleFocus,
        handleTouchEnd,
        handleTouchMove,
        handleTouchStart,
      ]
    )

    const KeyboardIcon = isOpen ? TbKeyboardOff : TbKeyboardShow
    const isActive = isOpen && focused
    // console.log(`'${inputId}'`, {isActive, inputRef})
    return (
      <KeyboardToggleRoot
        {...{ ref, sx }}
        aria-label={isOpen ? 'Close keyboard' : 'Open keyboard'}
        color={isActive ? 'primary' : 'default'}
        size="small"
        onClick={handleKeyboardToggle}
        onMouseDown={handleKeyboardMouseDown}
      >
        <KeyboardIcon size={14} />
      </KeyboardToggleRoot>
    )
  }
)

export default KeyboardToggle
