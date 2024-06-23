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
  const offset = useRef({ x: 0, y: 0 })
  const defaultSize = useRef({ default: true, numPad: true })

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
      // fix ratio of width to height for numPad cause it should be
      // different than default ratio
      console.log({
        default: {
          height: DEFAULT_WIDTH_TO_HEIGHT_RATIO * defaultWidth,
          width: defaultWidth,
        },
        numPad: {
          height: DEFAULT_WIDTH_TO_HEIGHT_RATIO * numPadWidth,
          width: numPadWidth,
        },
      })
      setBoxDimensions({
        default: {
          height: DEFAULT_WIDTH_TO_HEIGHT_RATIO * defaultWidth,
          width: defaultWidth,
        },
        numPad: {
          height: DEFAULT_WIDTH_TO_HEIGHT_RATIO * numPadWidth,
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
  const onMouseDown = (event) => {
    event.preventDefault()

    if (event.target.innerText === dragText) {
      setIsDragging(true)
      offset.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      }
    }
  }

  const onMouseMove = useCallback(
    (event) => {
      if (isDragging) {
        setPosition({
          x: event.clientX - offset.current.x,
          y: event.clientY - offset.current.y,
        })
      }
    },
    [isDragging]
  )

  const onMouseUp = () => {
    setIsDragging(false)
  }

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

  useEffect(() => {
    const onTouchStart = (event) => {
      event.preventDefault()

      if (event.target.innerText === dragText) {
        setIsDragging(true)
        offset.current = {
          x: event.touches[0].clientX - position.x,
          y: event.touches[0].clientY - position.y,
        }
      }
    }

    const onTouchMove = (event) => {
      if (isDragging) {
        setPosition({
          x: event.touches[0].clientX - offset.current.x,
          y: event.touches[0].clientY - offset.current.y,
        })
      }
    }

    const onTouchEnd = () => {
      setIsDragging(false)
    }

    const element = boxRef.current
    if (element) {
      element.addEventListener('touchstart', onTouchStart)
      element.addEventListener('touchmove', onTouchMove)
      element.addEventListener('touchend', onTouchEnd)

      return () => {
        element.removeEventListener('touchstart', onTouchStart)
        element.removeEventListener('touchmove', onTouchMove)
        element.removeEventListener('touchend', onTouchEnd)
      }
    }
  }, [isDragging, position.x, position.y])

  // Resize
  const onMouseDownResize = () => {
    setIsResizing(true)
  }

  const onMouseMoveResize = useCallback(
    (event) => {
      if (isResizing) {
        defaultSize.current = {
          default:
            layoutSizeName === 'default' ? false : defaultSize.current.default,
          numPad:
            layoutSizeName === 'numPad' ? false : defaultSize.current.numPad,
        }
        setBoxDimensions((prevDimensions) => ({
          ...prevDimensions,
          [layoutSizeName]: {
            width: Math.max(100, (event.clientX - position.x) * 2),
            height: Math.max(
              100,
              window.innerHeight - event.clientY + position.y
            ),
          },
        }))
      }
    },
    [layoutSizeName, isResizing, position.x, position.y]
  )

  const onMouseUpResize = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onMouseMoveResize)
      window.addEventListener('mouseup', onMouseUpResize)
    } else {
      window.removeEventListener('mousemove', onMouseMoveResize)
      window.removeEventListener('mouseup', onMouseUpResize)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMoveResize)
      window.removeEventListener('mouseup', onMouseUpResize)
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
        bottom: `${-position.y}px`,
        left: `${position.x}px`,
        width: `${boxDimensions[layoutSizeName].width}px`,
        height: `${boxDimensions[layoutSizeName].height}px`,
        transform: 'translate(-50%, 0)',
        zIndex: 1000000,
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: virtualKeyboard.isOpen ? 'visible' : 'hidden',
        touchAction: 'none',
        backgroundColor: 'blue',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
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
        }}
        onMouseDown={onMouseDownResize}
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
