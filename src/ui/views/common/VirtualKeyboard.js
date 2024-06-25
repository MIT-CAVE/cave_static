import { Box } from '@mui/material'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

const DEFAULT_WIDTH_TO_HEIGHT_RATIO = 1 / 3
const NUMPAD_WIDTH_TO_HEIGHT_RATIO = 11 / 10
const DEFAULT_WIDTH_RATIO = 0.8
const NUMPAD_WIDTH_RATIO = 0.2
const MAX_WIDTH = 1600

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
    default: { height: 0, width: 0 },
    numPad: { height: 0, width: 0 },
  })
  const [isResizing, setIsResizing] = useState(false)

  const boxRef = useRef(null)
  const keyboardRef = useRef(null)
  const cursorOffset = useRef({ x: 0, y: 0 })

  const dragText = 'drag to move'

  const layoutSizeName = useMemo(
    () => (virtualKeyboard.layout === 'numPad' ? 'numPad' : 'default'),
    [virtualKeyboard.layout]
  )

  // Reset position and default size when window is resized
  useEffect(() => {
    const onResize = () => {
      setPosition({
        x: window.innerWidth / 2,
        y: 0,
      })

      const defaultWidth = Math.min(
        DEFAULT_WIDTH_RATIO * window.innerWidth,
        MAX_WIDTH
      )
      const numPadWidth = Math.min(
        NUMPAD_WIDTH_RATIO * window.innerWidth,
        MAX_WIDTH
      )
      setBoxDimensions({
        default: {
          height: defaultWidth * DEFAULT_WIDTH_TO_HEIGHT_RATIO,
          width: defaultWidth,
        },
        numPad: {
          height: numPadWidth * NUMPAD_WIDTH_TO_HEIGHT_RATIO,
          width: numPadWidth,
        },
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [layoutSizeName, virtualKeyboard.layout])

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

      const left = newX - boxDimensions[layoutSizeName].width / 2
      const right = newX + boxDimensions[layoutSizeName].width / 2
      const top = newY + boxDimensions[layoutSizeName].height
      const bottom = newY

      if (left <= 0) newX = boxDimensions[layoutSizeName].width / 2
      if (window.innerWidth <= right)
        newX = window.innerWidth - boxDimensions[layoutSizeName].width / 2
      if (window.innerHeight <= top)
        newY = window.innerHeight - boxDimensions[layoutSizeName].height
      if (bottom <= 0) newY = 0

      setPosition({
        x: newX,
        y: newY,
      })
    },
    [isDragging, boxDimensions, layoutSizeName]
  )

  const onMouseMoveDrag = useCallback(
    (event) => {
      onDragMove(event.clientX, event.clientY)
    },
    [onDragMove]
  )

  const onDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
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
  }, [onMouseMoveDrag, isDragging])

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

  // Resizing
  const onResizeStart = () => {
    setIsResizing(true)
  }

  const onResizeMove = useCallback(
    (clientX, clientY) => {
      if (!isResizing) return

      let newWidth = Math.max(500, (clientX - position.x) * 2)
      let newHeight = Math.max(200, window.innerHeight - clientY - position.y)

      const left = position.x - newWidth / 2
      const right = position.x + newWidth / 2
      const top = position.y + newHeight

      if (left <= 0) newWidth = position.x * 2
      if (window.innerWidth <= right)
        newWidth = (window.innerWidth - position.x) * 2
      if (window.innerHeight <= top) newHeight = window.innerHeight - position.y

      setBoxDimensions((prevDimensions) => ({
        ...prevDimensions,
        [layoutSizeName]: {
          width: newWidth,
          height: newHeight,
        },
      }))
    },
    [layoutSizeName, isResizing, position]
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
        width: `${boxDimensions[layoutSizeName].width}px`,
        height: `${boxDimensions[layoutSizeName].height}px`,
        transform: 'translate(-50%, 0)',
        zIndex: 1000000,
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: virtualKeyboard.isOpen ? 'visible' : 'hidden',
        touchAction: 'none',
      }}
      onMouseDown={(event) => onDragStart(event, event.clientX, event.clientY)}
    >
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
          border: '1px solid white',
          borderRadius: '50%',
          color: 'white',
          cursor: isResizing ? 'grabbing' : 'grab',
        }}
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        onTouchMove={(event) =>
          onResizeMove(event.touches[0].clientX, event.touches[0].clientY)
        }
        onTouchEnd={onResizeEnd}
      >
        <IoMdResize />
      </Box>
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
            '~ ! {@} # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            '{lock} A S D F G H J K L : " {enter}',
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {drag}',
          ],
          numPad: [
            '7 8 9',
            '4 5 6',
            '1 2 3',
            '. 0 -',
            '{toggleDefault} {enter} {bksp}',
            '{drag}',
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
