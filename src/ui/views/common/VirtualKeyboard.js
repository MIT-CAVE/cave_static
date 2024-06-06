import { Box } from '@mui/material'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setInputValue,
  setCaretPosition,
} from '../../../data/utilities/virtualKeyboardSlice'

const VirtualKeyboard = () => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const [layoutName, setLayoutName] = useState('default')
  const [prevButton, setPrevButton] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - (0.8 * window.innerWidth) / 2,
    y: window.innerHeight - 250,
  })

  const keyboardRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const dragText = 'drag to move'

  // Reset position when window is resized
  useEffect(() => {
    const onResize = () => {
      setPosition({
        x: window.innerWidth / 2 - (0.8 * window.innerWidth) / 2,
        y: window.innerHeight - 250,
      })
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Dragging
  const onMouseDown = (e) => {
    e.preventDefault()

    if (e.target.innerText === dragText) {
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    }
  }

  const onMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        })
      }
    },
    [isDragging]
  )

  const onMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    } else {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, isDragging])

  // Sync keyboard with input field value
  useEffect(() => {
    if (
      keyboardRef.current.getInput() &&
      virtualKeyboard.inputValue !== keyboardRef.current.getInput()
    ) {
      keyboardRef.current?.setInput(virtualKeyboard.inputValue)
    }
  }, [dispatch, virtualKeyboard.inputValue, virtualKeyboard.caretPosition])

  const onKeyPress = (button) => {
    let nextLayout = layoutName

    if (button === '{shift}' || button === '{lock}') {
      nextLayout = layoutName === 'default' ? 'shift' : 'default'
    } else if (button === '{toggleNumPad}') {
      nextLayout = 'numPad'
    } else if (button === '{toggleDefault}') {
      nextLayout = 'default'
    } else if (
      prevButton === '{shift}' &&
      layoutName === 'shift' &&
      button !== '{drag}'
    ) {
      nextLayout = 'default'
    }

    setLayoutName(nextLayout)
    setPrevButton(button)
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '80vw',
        zIndex: 1000000,
        color: 'black',
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: virtualKeyboard.isOpen ? 'visible' : 'hidden',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <Keyboard
        keyboardRef={(r) => (keyboardRef.current = r)}
        onChange={(value) => {
          dispatch(setInputValue(value))

          if (
            keyboardRef.current.getCaretPosition() !== null &&
            keyboardRef.current.getCaretPosition() !==
              virtualKeyboard.caretPosition[0]
          ) {
            dispatch(
              setCaretPosition([
                keyboardRef.current.getCaretPosition(),
                keyboardRef.current.getCaretPosition(),
              ])
            )
          }
        }}
        onKeyPress={onKeyPress}
        layoutName={layoutName}
        layout={{
          default: [
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            "{lock} a s d f g h j k l ; ' {enter}",
            '{shift} z x c v b n m , . / {shift}',
            '{toggleNumPad} {space} {drag}',
          ],
          shift: [
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            '{lock} A S D F G H J K L : " {enter}',
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {drag}',
          ],
          numPad: [
            '7 8 9',
            '4 5 6',
            '1 2 3',
            '0 . {bksp}',
            '{toggleDefault} {enter} {drag}',
          ],
        }}
        display={{
          '{bksp}': 'backspace',
          '{tab}': 'tab',
          '{enter}': 'enter',
          '{shift}': 'shift',
          '{lock}': 'caps',
          '{toggleNumPad}': '123',
          '{toggleDefault}': 'ABC',
          '{space}': ' ',
          '{drag}': dragText,
        }}
        buttonTheme={[
          {
            class: 'bigger-keys',
            buttons: '{space}',
          },
        ]}
      />
    </Box>
  )
}

export default VirtualKeyboard
