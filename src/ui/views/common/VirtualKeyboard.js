import { Box } from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

import { selectVirtualKeyboard } from '../../../data/selectors'
import { setInputValue } from '../../../data/utilities/virtualKeyboardSlice'

const VirtualKeyboard = ({ controlled, onChange }) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const [layoutName, setLayoutName] = useState('default')
  const [prevButton, setPrevButton] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const keyboardRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    keyboardRef?.current?.setInput(virtualKeyboard.inputValue)
  }, [virtualKeyboard.inputValue])

  const onKeyPress = (button) => {
    let nextLayout = layoutName

    if (button === '{shift}' || button === '{lock}') {
      nextLayout = layoutName === 'default' ? 'shift' : 'default'
    } else if (button === '{toggleNumPad}') {
      nextLayout = 'numPad'
    } else if (button === '{toggleDefault}') {
      nextLayout = 'default'
    } else if (prevButton === '{shift}' && layoutName === 'shift') {
      nextLayout = 'default'
    }

    setLayoutName(nextLayout)
    setPrevButton(button)
  }

  const setInput = (value) => {
    dispatch(setInputValue(value))
  }

  const onMouseDown = (e) => {
    if (e.target.innerText === 'drag') {
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    }
  }

  const onMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
  }

  const onMouseUp = () => {
    setIsDragging(false)
  }

  // TODOB REMOVE
  // if (!virtualKeyboard.isOpen) return null

  // TODOB FIX DRAGGING
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: `${position.y}px`,
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
          controlled ? onChange(value) : setInput(value)
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
          '{drag}': 'drag',
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
