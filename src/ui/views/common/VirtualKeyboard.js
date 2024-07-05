import { Box } from '@mui/material'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { IoMdResize } from 'react-icons/io'
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

const Resizable = ({ position, boxDimensions, setBoxDimensions }) => {
  const virtualKeyboard = useSelector(selectVirtualKeyboard)
  const [isResizing, setIsResizing] = useState(false)
  const cursorOffset = useRef({ x: 0, y: 0 })

  const onResizeStart = (clientX, clientY) => {
    setIsResizing(true)

    cursorOffset.current = {
      x: clientX - boxDimensions.width / 2,
      y: window.innerHeight - clientY - boxDimensions.height,
    }
  }

  const onResizeMove = useCallback(
    (clientX, clientY) => {
      if (!isResizing) return

      let newWidth = Math.max(
        DEFAULT_MIN_WIDTH *
          (virtualKeyboard.layout === 'numPad'
            ? DEFAULT_TO_NUMPAD_WIDTH_RATIO
            : 1),
        (clientX - cursorOffset.current.x) * 2
      )
      let newHeight = Math.max(
        MIN_HEIGHT,
        window.innerHeight - clientY - cursorOffset.current.y
      )

      const left = position.x - newWidth / 2
      const right = position.x + newWidth / 2
      const top = position.y + newHeight

      if (left < 0) newWidth = position.x * 2
      if (window.innerWidth < right)
        newWidth = (window.innerWidth - position.x) * 2
      if (window.innerHeight < top) newHeight = window.innerHeight - position.y

      setBoxDimensions({
        width: newWidth,
        height: newHeight,
      })
    },
    [isResizing, position, setBoxDimensions, virtualKeyboard.layout]
  )

  const onResizeEnd = () => {
    setIsResizing(false)
  }

  const onMouseMoveResize = useCallback(
    (event) => {
      onResizeMove(event.clientX, event.clientY)
    },
    [onResizeMove]
  )

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onMouseMoveResize)
      window.addEventListener('mouseup', onResizeEnd)
    } else {
      window.removeEventListener('mousemove', onMouseMoveResize)
      window.removeEventListener('mouseup', onResizeEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMoveResize)
      window.removeEventListener('mouseup', onResizeEnd)
    }
  }, [onMouseMoveResize, isResizing])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        transform: 'translate(50%, -50%)',
        width: '50px',
        height: '50px',
        zIndex: 1000001,
        backgroundColor: 'gray',
        border: '3px solid rgb(116, 116, 116)',
        borderRadius: '50%',
        color: 'white',
        cursor: isResizing ? 'grabbing' : 'grab',
      }}
      onMouseDown={(event) => onResizeStart(event.clientX, event.clientY)}
      onTouchStart={(event) =>
        onResizeStart(event.touches[0].clientX, event.touches[0].clientY)
      }
      onTouchMove={(event) =>
        onResizeMove(event.touches[0].clientX, event.touches[0].clientY)
      }
      onTouchEnd={onResizeEnd}
    >
      <IoMdResize />
    </Box>
  )
}

const DEFAULT_WIDTH_RATIO = 0.8
const DEFAULT_TO_NUMPAD_WIDTH_RATIO = 1 / 4
const DEFAULT_WIDTH_TO_HEIGHT_RATIO = 2 / 7
const DEFAULT_MAX_WIDTH = 1600
const DEFAULT_MIN_WIDTH = 1000
const MIN_HEIGHT = 300

const dragText = 'drag to move'

const VirtualKeyboard = () => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const [prevButton, setPrevButton] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: 0,
  })
  const [boxDimensions, setBoxDimensions] = useState({
    height: 0,
    width: 0,
  })

  const boxRef = useRef(null)
  const keyboardRef = useRef(null)
  const cursorOffset = useRef({ x: 0, y: 0 })

  const isNumPad = useMemo(
    () => virtualKeyboard.layout === 'numPad',
    [virtualKeyboard.layout]
  )

  useEffect(() => {
    // Change width when layout is changed
    setBoxDimensions((prevDimensions) => ({
      ...prevDimensions,
      width: Math.min(
        window.innerWidth,
        prevDimensions.width *
          (isNumPad
            ? DEFAULT_TO_NUMPAD_WIDTH_RATIO
            : 1 / DEFAULT_TO_NUMPAD_WIDTH_RATIO)
      ),
    }))

    // Reset position and default size when window is resized
    const onResize = () => {
      setPosition({
        x: window.innerWidth / 2,
        y: 0,
      })

      const defaultWidth = Math.min(
        DEFAULT_WIDTH_RATIO * window.innerWidth,
        DEFAULT_MAX_WIDTH
      )
      setBoxDimensions({
        height: defaultWidth * DEFAULT_WIDTH_TO_HEIGHT_RATIO,
        width: defaultWidth * (isNumPad ? DEFAULT_TO_NUMPAD_WIDTH_RATIO : 1),
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [isNumPad])

  // Clip keyboard into window when changing from numPad to default
  // would otherwise make some part of keyboard appear offscreen
  useEffect(() => {
    const newWidth = boxDimensions.width

    let newX = position.x

    const left = position.x - newWidth / 2
    const right = position.x + newWidth / 2

    if (left < 0) newX = newWidth / 2
    if (window.innerWidth < right) newX = window.innerWidth - newWidth / 2

    if (newX !== position.x) {
      setPosition((prevPosition) => ({
        ...prevPosition,
        x: newX,
      }))
    }
  }, [boxDimensions.width, position.x])

  // Dragging
  const onDragStart = useCallback(
    (event, clientX, clientY) => {
      event.preventDefault()

      if (event.target.innerText === dragText) {
        setIsDragging(true)
        cursorOffset.current = {
          x: clientX - position.x,
          y: window.innerHeight - clientY - position.y,
        }
      }
    },
    [position]
  )

  const onDragMove = useCallback(
    (clientX, clientY) => {
      if (!isDragging) return

      let newX = clientX - cursorOffset.current.x
      let newY = window.innerHeight - clientY - cursorOffset.current.y

      const left = newX - boxDimensions.width / 2
      const right = newX + boxDimensions.width / 2
      const top = newY + boxDimensions.height
      const bottom = newY

      if (left < 0) newX = boxDimensions.width / 2
      if (window.innerWidth < right)
        newX = window.innerWidth - boxDimensions.width / 2
      if (window.innerHeight < top)
        newY = window.innerHeight - boxDimensions.height
      if (bottom < 0) newY = 0

      setPosition({
        x: newX,
        y: newY,
      })
    },
    [isDragging, boxDimensions]
  )

  const onDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const onMouseMoveDrag = (event) => {
      onDragMove(event.clientX, event.clientY)
    }

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMoveDrag)
      window.addEventListener('mouseup', onDragEnd)
    } else {
      window.removeEventListener('mousemove', onMouseMoveDrag)
      window.removeEventListener('mouseup', onDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMoveDrag)
      window.removeEventListener('mouseup', onDragEnd)
    }
  }, [onDragMove, isDragging])

  // Reset caret position when lost by changing from default to numPad layout
  useEffect(() => {
    const onMouseUpGlobal = () => {
      if (
        keyboardRef?.current !== null &&
        keyboardRef.current?.getCaretPosition() === null
      ) {
        keyboardRef.current.setCaretPosition(virtualKeyboard.caretPosition[0])
      }
    }

    window.addEventListener('mouseup', onMouseUpGlobal)

    return () => {
      window.removeEventListener('mouseup', onMouseUpGlobal)
    }
  }, [virtualKeyboard.caretPosition])

  useEffect(() => {
    const onTouchStartDrag = (event) => {
      onDragStart(event, event.touches[0].clientX, event.touches[0].clientY)
    }

    const onTouchMoveDrag = (event) => {
      onDragMove(event.touches[0].clientX, event.touches[0].clientY)
    }

    const element = boxRef.current
    if (element) {
      element.addEventListener('touchstart', onTouchStartDrag)
      element.addEventListener('touchmove', onTouchMoveDrag)
      element.addEventListener('touchend', onDragEnd)

      return () => {
        element.removeEventListener('touchstart', onTouchStartDrag)
        element.removeEventListener('touchmove', onTouchMoveDrag)
        element.removeEventListener('touchend', onDragEnd)
      }
    }
  }, [onDragStart, onDragMove])

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

    setTimeout(() => {
      dispatch(setLayout(nextLayout))
      setPrevButton(button)
    }, 0)
  }

  return (
    <Box
      ref={boxRef}
      sx={{
        position: 'fixed',
        bottom: `${position.y}px`,
        left: `${position.x}px`,
        width: `${boxDimensions.width}px`,
        height: `${boxDimensions.height}px`,
        transform: 'translate(-50%, 0)',
        zIndex: 1000000,
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: virtualKeyboard.isOpen ? 'visible' : 'hidden',
        touchAction: 'none',
      }}
      onMouseDown={(event) => onDragStart(event, event.clientX, event.clientY)}
    >
      <Resizable
        position={position}
        boxDimensions={boxDimensions}
        setBoxDimensions={setBoxDimensions}
      />
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
            '{drag}',
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            "{lock} a s d f g h j k l ; ' {enter}",
            '{shift} z x c v b n m , . / {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          shift: [
            '{drag}',
            '~ ! {@} # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            '{lock} A S D F G H J K L : " {enter}',
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          numPad: [
            '{drag}',
            '7 8 9',
            '4 5 6',
            '1 2 3',
            '. 0 -',
            '{toggleDefault} {enter} {bksp}',
          ],
        }}
        display={{
          '{bksp}': 'delete',
          '{tab}': 'tab',
          '{enter}': 'enter',
          '{shift}': 'shift',
          '{lock}': 'caps',
          '{toggleNumPad}': '123',
          '{toggleDefault}': 'ABC',
          '{space}': ' ',
          '{drag}': dragText,
          '{@}': '@',
        }}
        buttonTheme={[
          {
            class: 'bigger-keys',
            buttons: '{space}',
          },
          {
            class: 'medium-keys',
            buttons: '{bksp} {tab} {lock} {enter} {shift}',
          },
          {
            class: 'smaller-keys',
            buttons: '` 1 2 3 4 5 6 7 8 9 0 - = ~ ! {@} # $ % ^ & * ( ) _ +',
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
