import { Box } from '@mui/material'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import './virtual-keyboard.css'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setLayout,
  setInputValue,
  setCaretPosition,
} from '../../../data/utilities/virtualKeyboardSlice'

const DEFAULT_WIDTH_RATIO = 0.8
const NUMPAD_WIDTH_RATIO = 0.2

const VirtualKeyboard = () => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const [prevButton, setPrevButton] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight,
  })
  const [boxHeight, setBoxHeight] = useState(0)

  const boxRef = useRef(null)
  const keyboardRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const dragText = 'drag to move'

  useEffect(() => {
    if (boxRef.current) {
      const { height } = boxRef.current.getBoundingClientRect()
      setBoxHeight(height)
    }
  }, [virtualKeyboard.isOpen])

  // Reset position when window is resized
  useEffect(() => {
    const onResize = () => {
      setPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight,
      })
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Dragging
  const onMouseDown = (event) => {
    event.preventDefault()

    if (event.target.innerText === dragText) {
      setIsDragging(true)
      dragOffset.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      }
    }
  }

  const onMouseMove = useCallback(
    (event) => {
      if (isDragging) {
        setPosition({
          x: event.clientX - dragOffset.current.x,
          y: event.clientY - dragOffset.current.y,
        })
      }
    },
    [isDragging]
  )

  const onMouseUp = () => {
    setIsDragging(false)
  }

  const onTouchStart = (event) => {
    if (event.target.innerText === dragText) {
      setIsDragging(true)
      dragOffset.current = {
        x: event.touches[0].clientX - position.x,
        y: event.touches[0].clientY - position.y,
      }
    }
  }

  const onTouchMove = (event) => {
    if (isDragging) {
      setPosition({
        x: event.touches[0].clientX - dragOffset.current.x,
        y: event.touches[0].clientY - dragOffset.current.y,
      })
    }
  }

  const onTouchEnd = () => {
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
    if (virtualKeyboard.inputValue !== keyboardRef.current.getInput()) {
      keyboardRef.current?.setInput(virtualKeyboard.inputValue)
    }
  }, [dispatch, virtualKeyboard.inputValue])

  // Sync keyboard with input field caret position
  useEffect(() => {
    if (
      virtualKeyboard.caretPosition[0] !==
      keyboardRef.current.getCaretPosition()
    ) {
      keyboardRef.current?.setCaretPosition(virtualKeyboard.caretPosition[0])
    }
  }, [dispatch, virtualKeyboard.caretPosition])

  const onKeyPress = (button) => {
    let nextLayout = virtualKeyboard.layout

    if (button === '{shift}' || button === '{lock}') {
      nextLayout = virtualKeyboard.layout === 'default' ? 'shift' : 'default'
    } else if (button === '{toggleNumPad}') {
      nextLayout = 'numPad'
    } else if (button === '{toggleDefault}') {
      nextLayout = 'default'
    } else if (
      prevButton === '{shift}' &&
      virtualKeyboard.layout === 'shift' &&
      button !== '{drag}'
    ) {
      nextLayout = 'default'
    }

    dispatch(setLayout(nextLayout))
    setPrevButton(button)
  }

  return (
    <Box
      ref={boxRef}
      sx={{
        position: 'fixed',
        bottom: `${window.innerHeight - position.y - boxHeight / 2}px`,
        left: `${position.x}px`,
        width: `${(virtualKeyboard.layout === 'numPad' ? NUMPAD_WIDTH_RATIO : DEFAULT_WIDTH_RATIO) * 100}vw`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000000,
        color: 'black',
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: virtualKeyboard.isOpen ? 'visible' : 'hidden',
        touchAction: 'none',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
        theme={`hg-theme-default ${virtualKeyboard.layout === 'numPad' && 'hg-layout-numpad'}`}
        layoutName={virtualKeyboard.layout}
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
            '. 0 {bksp}',
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
          {
            class: 'drag',
            buttons: '{drag}',
          },
        ]}
      />
    </Box>
  )
}

export default VirtualKeyboard
