import { Box, Paper } from '@mui/material'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TbResize } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
  setLastKeyPress,
} from '../../../data/utilities/virtualKeyboardSlice'
import RippleBox from '../../compound/RippleBox'

import { DragHandle } from '../../draggables'

const DEFAULT_WIDTH_RATIO = 0.8
const DEFAULT_TO_NUMPAD_WIDTH_RATIO = 1 / 4
const DEFAULT_WIDTH_TO_HEIGHT_RATIO = 2 / 7
const DEFAULT_MAX_WIDTH = 1600
const DEFAULT_MIN_WIDTH = 1300
const MIN_HEIGHT = 300

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
    <RippleBox
      className="resize-handle"
      sx={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '22px',
        height: '22px',
        zIndex: 1000001,
        bgcolor: 'grey.800',
        cursor: isResizing ? 'grabbing' : 'grab',
        color: 'white',
        ':hover': {
          bgcolor: 'grey.700',
        },
      }}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onResizeStart(event.clientX, event.clientY)
      }}
      onTouchStart={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onResizeStart(event.touches[0].clientX, event.touches[0].clientY)
      }}
      onTouchMove={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onResizeMove(event.touches[0].clientX, event.touches[0].clientY)
      }}
      onTouchEnd={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onResizeEnd()
      }}
    >
      <TbResize size={16} style={{ transform: 'translateX(1px)' }} />
    </RippleBox>
  )
}

const VirtualKeyboard = () => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const isNumPad = useMemo(
    () => virtualKeyboard.layout === 'numPad',
    [virtualKeyboard.layout]
  )

  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: (window.innerHeight - MIN_HEIGHT) / 2,
  })
  const [boxDimensions, setBoxDimensions] = useState(() => {
    const defaultWidth = Math.min(
      DEFAULT_WIDTH_RATIO * window.innerWidth,
      DEFAULT_MAX_WIDTH
    )
    return {
      height: MIN_HEIGHT,
      width: isNumPad
        ? Math.min(
            window.innerWidth,
            Math.max(325, defaultWidth * DEFAULT_TO_NUMPAD_WIDTH_RATIO)
          )
        : Math.min(window.innerWidth, defaultWidth),
    }
  })

  const boxRef = useRef(null)
  const keyboardRef = useRef(null)
  const cursorOffset = useRef({ x: 0, y: 0 })

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
    const defaultWidth = Math.min(
      DEFAULT_WIDTH_RATIO * window.innerWidth,
      DEFAULT_MAX_WIDTH
    )
    const newWidth = isNumPad
      ? Math.min(
          window.innerWidth,
          Math.max(325, defaultWidth * DEFAULT_TO_NUMPAD_WIDTH_RATIO)
        )
      : Math.min(window.innerWidth, defaultWidth)

    setBoxDimensions((prevDimensions) => ({
      ...prevDimensions,
      width: newWidth,
    }))

    // Reset position and default size when window is resized
    const onResize = () => {
      const defaultWidthResized = Math.min(
        DEFAULT_WIDTH_RATIO * window.innerWidth,
        DEFAULT_MAX_WIDTH
      )
      const height = defaultWidthResized * DEFAULT_WIDTH_TO_HEIGHT_RATIO
      const newWidthResized = isNumPad
        ? Math.min(
            window.innerWidth,
            Math.max(325, defaultWidthResized * DEFAULT_TO_NUMPAD_WIDTH_RATIO)
          )
        : Math.min(window.innerWidth, defaultWidthResized)

      setBoxDimensions({
        height,
        width: newWidthResized,
      })
      setPosition({
        x: window.innerWidth / 2,
        y: (window.innerHeight - height) / 2,
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [isNumPad])

  useEffect(() => {
    // Reset the last key press after a short delay (10ms) to
    // allow proper click away handling in affected components
    setTimeout(() => {
      dispatch(setLastKeyPress(null))
    }, 10)
  }, [virtualKeyboard.isOpen, isNumPad, dispatch])

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
      if (!event.target.closest('.drag-handle')) return

      event.preventDefault()
      setIsDragging(true)
      cursorOffset.current = {
        x: clientX - position.x,
        y: window.innerHeight - clientY - position.y,
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

  // Restore caret to end when it gets lost (e.g. switching layouts)
  useEffect(() => {
    const onMouseUpGlobal = () => {
      if (
        keyboardRef?.current !== null &&
        keyboardRef.current?.getCaretPosition() === null
      ) {
        const len = (keyboardRef.current.getInput() || '').length
        keyboardRef.current.setCaretPosition(len)
      }
    }

    window.addEventListener('mouseup', onMouseUpGlobal)
    window.addEventListener('touchend', onMouseUpGlobal)

    return () => {
      window.removeEventListener('mouseup', onMouseUpGlobal)
      window.removeEventListener('touchend', onMouseUpGlobal)
    }
  }, [])

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

  // Sync keyboard value when changed externally (field focus, external state update)
  useEffect(() => {
    if (
      keyboardRef.current &&
      virtualKeyboard.inputValue !== keyboardRef.current.getInput() &&
      virtualKeyboard.lastKeyPress === null // Only sync from external sources
    ) {
      keyboardRef.current.setInput(virtualKeyboard.inputValue)
      keyboardRef.current.setCaretPosition(virtualKeyboard.inputValue?.length)
    }
  }, [virtualKeyboard.inputValue, virtualKeyboard.lastKeyPress])

  // Force-reset internal keyboard buffer when VK ownership transfers between
  // fields. Without this, a trailing `{blur}` on `lastKeyPress` blocks the
  // sync effect above, so the next keystroke would append to the prior
  // field's buffer and leak into the newly focused field.
  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.setInput(virtualKeyboard.inputValue)
      keyboardRef.current.setCaretPosition(virtualKeyboard.inputValue?.length)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualKeyboard.activeFieldId])

  useEffect(() => {
    const handlePhysicalKeyDown = (event) => {
      if (!virtualKeyboard.isOpen) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'Backspace') {
        event.preventDefault()
        const newValue = virtualKeyboard.inputValue.toString().slice(0, -1)
        dispatch(setInputValue(newValue))
        keyboardRef.current?.setInput(newValue)
        keyboardRef.current?.setCaretPosition(newValue.length)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        dispatch(setEnter(true))
        return
      }

      // Single printable character — mirror a VK key press
      if (event.key.length === 1) {
        // In numPad mode restrict to the keys available on the numPad
        if (virtualKeyboard.layout === 'numPad' && !/^[-0-9.]$/.test(event.key))
          return

        event.preventDefault()
        const newValue = virtualKeyboard.inputValue + event.key
        dispatch(setInputValue(newValue))
        keyboardRef.current?.setInput(newValue)
        keyboardRef.current?.setCaretPosition(newValue.length)
      }
    }

    // Capture phase so we intercept before the focused input processes the key
    window.addEventListener('keydown', handlePhysicalKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyDown, true)
    }
  }, [
    virtualKeyboard.isOpen,
    virtualKeyboard.inputValue,
    virtualKeyboard.layout,
    dispatch,
  ])

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
      onMouseDown={(event) => {
        event.preventDefault()
        onDragStart(event, event.clientX, event.clientY)
      }}
    >
      <Resizable
        position={position}
        setPosition={setPosition}
        boxDimensions={boxDimensions}
        setBoxDimensions={setBoxDimensions}
      />
      <DragHandle
        sx={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 2,
          py: 1,
          backgroundColor: 'var(--gray-3)',
          color: 'text.primary',
          borderBottom: '2px solid var(--gray-1)',
          border: '2px solid',
          borderColor: 'primary.main',
          m: 1,
          borderRadius: 1,
          minHeight: '50px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maskImage:
            'radial-gradient(circle 22px at 0 0, #0000 95%, #000 100%), radial-gradient(circle 22px at 100% 0, #0000 95%, #000 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage:
            'radial-gradient(circle 22px at 0 0, #0000 95%, #000 100%), radial-gradient(circle 22px at 100% 0, #0000 95%, #000 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <Box
          sx={{
            flex: '1 1 auto',
            textAlign: 'right',
            fontSize: '1.5rem',
            overflow: 'hidden',
          }}
        >
          {virtualKeyboard.inputValue}
        </Box>
      </Box>
      <Keyboard
        keyboardRef={(r) => (keyboardRef.current = r)}
        onChange={(value) => {
          if (value === virtualKeyboard.inputValue) return
          dispatch(setInputValue(value))
          // Always keep caret at end so the next keypress appends correctly
          keyboardRef.current.setCaretPosition(value.length)
          dispatch(setCaretPosition([value.length, value.length]))
        }}
        newLineOnEnter={true}
        onKeyPress={(button) => {
          let nextLayout = virtualKeyboard.layout

          if (button === '{bksp}') {
            const newValue = virtualKeyboard.inputValue.toString().slice(0, -1)
            dispatch(setInputValue(newValue))
            keyboardRef.current.setInput(newValue)
            keyboardRef.current.setCaretPosition(newValue.length)
          } else if (button === '{shift}') {
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
            (virtualKeyboard.lastKeyPress === '{shift}' ||
              virtualKeyboard.lastKeyPress === '{lock}') &&
            virtualKeyboard.layout === 'shift'
          ) {
            nextLayout = 'default'
          } else if (virtualKeyboard.layout === 'shiftAndLock') {
            nextLayout = 'lock'
          }

          setTimeout(() => {
            dispatch(setLayout(nextLayout))
            dispatch(setLastKeyPress(button))
          }, 0)
        }}
        theme={`hg-theme-default ${virtualKeyboard.layout === 'numPad' && 'hg-layout-numpad'}`}
        layoutName={virtualKeyboard.layout}
        layout={{
          default: [
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            `{lock} a s d f g h j k l ; ' ${enterKeys}`,
            '{shift} z x c v b n m , . / {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          shift: [
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            `{lock} A S D F G H J K L : " ${enterKeys}`,
            '{shift} Z X C V B N M < > ? {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          lock: [
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} Q W E R T Y U I O P [ ] \\',
            `{lock} A S D F G H J K L ; ' ${enterKeys}`,
            '{shift} Z X C V B N M , . / {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          shiftAndLock: [
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} q w e r t y u i o p { } |',
            `{lock} a s d f g h j k l : " ${enterKeys}`,
            '{shift} z x c v b n m < > ? {shift}',
            '{toggleNumPad} {space} {toggleNumPad}',
          ],
          numPad: [
            '7 8 9',
            '4 5 6',
            '1 2 3',
            '. 0 -',
            '{toggleDefault} {blur} {bksp}',
          ],
        }}
        display={{
          '{bksp}': '⌫',
          '{tab}': 'tab',
          '{enter}': 'enter',
          '{blur}': 'submit',
          '{shift}': 'shift',
          '{lock}': 'caps',
          '{toggleNumPad}': '123',
          '{toggleDefault}': 'ABC',
          '{space}': ' ',
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
          ...addHighlightClass('shift', '{shift}'),
          ...addHighlightClass('lock', '{lock}'),
          ...addHighlightClass('shiftAndLock', '{shift} {lock}'),
        ]}
      />
    </Box>
  )
}

export default VirtualKeyboard
