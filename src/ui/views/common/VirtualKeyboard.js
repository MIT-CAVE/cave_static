import { Box, Paper } from '@mui/material'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { IoMdResize } from 'react-icons/io'
import { useDispatch, useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
} from '../../../data/utilities/virtualKeyboardSlice'

const Resizable = ({
  position,
  setPosition,
  boxDimensions,
  setBoxDimensions,
}) => {
  const virtualKeyboard = useSelector(selectVirtualKeyboard)
  const [isResizing, setIsResizing] = useState(false)
  const cursorOffset = useRef({ x: 0, y: 0 })

  const onResizeStart = (clientX, clientY) => {
    setIsResizing(true)

    cursorOffset.current = {
      x: clientX - boxDimensions.width,
      y: -clientY - boxDimensions.height,
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
        clientX - cursorOffset.current.x
      )
      let newHeight = Math.max(MIN_HEIGHT, -clientY - cursorOffset.current.y)

      const deltaWidth = newWidth - boxDimensions.width
      let newPositionX = position.x + deltaWidth / 2

      const left = position.x - boxDimensions.width / 2
      const right = newPositionX + newWidth / 2
      const top = position.y + newHeight

      if (window.innerWidth < right) {
        newWidth = window.innerWidth - left
        newPositionX = left + newWidth / 2
      }
      if (window.innerHeight < top) newHeight = window.innerHeight - position.y

      setBoxDimensions({
        width: newWidth,
        height: newHeight,
      })

      setPosition({
        ...position,
        x: newPositionX,
      })
    },
    [
      isResizing,
      position,
      setPosition,
      boxDimensions.width,
      setBoxDimensions,
      virtualKeyboard.layout,
    ]
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
const DEFAULT_MIN_WIDTH = 1300
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

  const enterKeys = useMemo(
    () => (virtualKeyboard.isTextArea ? '[{enter} {blur}]' : '{blur}'),
    [virtualKeyboard.isTextArea]
  )

  const addHighlightClass = useCallback(
    (layout, buttons) =>
      virtualKeyboard.layout === layout
        ? [{ class: 'highlight', buttons }]
        : [],
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

  useEffect(() => {
    setPrevButton(null)
  }, [virtualKeyboard.isOpen, isNumPad])

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

  return (
    <Box
      ref={boxRef}
      component={Paper}
      elevation={12}
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
        ...styles,
      }}
      onMouseDown={(event) => onDragStart(event, event.clientX, event.clientY)}
    >
      <Resizable
        position={position}
        setPosition={setPosition}
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
        newLineOnEnter={true}
        onKeyPress={(button) => {
          let nextLayout = virtualKeyboard.layout

          if (button === '{shift}') {
            nextLayout =
              virtualKeyboard.layout === 'default'
                ? 'shift'
                : virtualKeyboard.layout === 'lock'
                  ? 'shiftAndLock'
                  : virtualKeyboard.layout === 'shiftAndLock'
                    ? 'lock'
                    : 'default'
          } else if (button === '{lock}') {
            nextLayout =
              virtualKeyboard.layout === 'default'
                ? 'lock'
                : virtualKeyboard.layout === 'shift'
                  ? 'shiftAndLock'
                  : virtualKeyboard.layout === 'shiftAndLock'
                    ? 'shift'
                    : 'default'
          } else if (button === '{toggleNumPad}') {
            nextLayout = 'numPad'
          } else if (button === '{toggleDefault}') {
            nextLayout = 'default'
          } else if (button === '{blur}') {
            dispatch(setEnter(true))
          } else if (
            // QUESTION: Do we really need to check `prevButton` here?
            (prevButton === '{shift}' || prevButton === '{lock}') &&
            virtualKeyboard.layout === 'shift' &&
            button !== '{drag}'
          ) {
            nextLayout = 'default'
          } else if (
            virtualKeyboard.layout === 'shiftAndLock' &&
            button !== '{drag}'
          ) {
            nextLayout = 'lock'
          }

          setTimeout(() => {
            dispatch(setLayout(nextLayout))
            setPrevButton(button)
          }, 0)
        }}
        theme={`hg-theme-default ${virtualKeyboard.layout === 'numPad' && 'hg-layout-numpad'}`}
        layoutName={virtualKeyboard.layout}
        layout={{
          default: [
            '{drag}',
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            `{lock} a s d f g h j k l ; ' ${enterKeys}`,
            '{shift} z x c v b n m , . / {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          shift: [
            '{drag}',
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            `{lock} A S D F G H J K L : " ${enterKeys}`,
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          lock: [
            '{drag}',
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            `{lock} A S D F G H J K L : " ${enterKeys}`,
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          shiftAndLock: [
            '{drag}',
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            `{lock} a s d f g h j k l ; ' ${enterKeys}`,
            '{shift} z x c v b n m , . / {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          numPad: [
            '{drag}',
            '7 8 9',
            '4 5 6',
            '1 2 3',
            '. 0 -',
            '{toggleDefault} {blur} {bksp}',
          ],
        }}
        display={{
          '{bksp}': 'delete',
          '{tab}': 'tab',
          '{enter}': 'enter',
          '{blur}': 'submit',
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
            class: 'medium-keys',
            buttons: '{bksp} {tab} {lock} {blur} {enter} {shift}',
          },
          {
            class: 'smaller-keys',
            buttons: '` 1 2 3 4 5 6 7 8 9 0 - = ~ ! @ # $ % ^ & * ( ) _ +',
          },
          {
            class: 'drag',
            buttons: '{drag}',
          },
          ...addHighlightClass('shift', '{shift}'),
          ...addHighlightClass('lock', '{lock}'),
          ...addHighlightClass('shiftAndLock', '{shift} {lock}'),
        ]}
      />
    </Box>
  )
}

export default VirtualKeyboard

const styles = {
  '& .react-simple-keyboard': {
    '--gray-1': (theme) => theme.palette.grey[600],
    '--gray-2': (theme) => theme.palette.grey[700], // theme.palette.background.paper,
    '--gray-3': (theme) => theme.palette.grey[800],
    backgroundColor: 'var(--gray-2)',
    height: '100%',
  },
  '& .react-simple-keyboard .hg-rows': {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  '& .react-simple-keyboard .hg-row': {
    flex: 1,
  },
  '& .react-simple-keyboard .hg-button': {
    color: 'text.primary',
    backgroundColor: 'var(--gray-1)',
    height: '100%',
    fontSize: '1.25rem',
    padding: 0,
    boxShadow: (theme) => theme.shadows[12],
  },
  '& .react-simple-keyboard .hg-button.bigger-keys': {
    flex: 3,
  },
  '& .react-simple-keyboard .hg-button.medium-keys, & .react-simple-keyboard .hg-button-container':
    {
      flex: 2,
    },
  '& .react-simple-keyboard .hg-button.smaller-keys, & .react-simple-keyboard.hg-layout-numpad .hg-button':
    {
      flex: 1,
    },
  '& .react-simple-keyboard .hg-button.highlight': {
    backgroundColor: 'var(--gray-2)',
    color: '#0f0',
    // fontWeight: 800,
  },
  '& .react-simple-keyboard .hg-button.highlight:hover': {
    backgroundColor: 'var(--gray-1)',
  },
  '& .react-simple-keyboard .hg-button:hover': {
    cursor: 'pointer',
    backgroundColor: 'var(--gray-2)',
  },
  '& .react-simple-keyboard .hg-button.drag:hover': {
    cursor: 'grab',
  },
  '& .react-simple-keyboard .hg-button.drag:active': {
    cursor: 'grabbing',
  },
  '& .react-simple-keyboard .hg-button:active': {
    backgroundColor: 'var(--gray-3)',
  },
}
