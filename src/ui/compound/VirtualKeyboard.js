import { useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

const KeyboardWrapper = ({ keyboardRef, controlled, setInput, onChange }) => {
  const [layoutName, setLayoutName] = useState('default')
  const [prevButton, setPrevButton] = useState(null)

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

  return (
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
          '{toggleNumPad} {space} {toggleNumPad}',
        ],
        shift: [
          '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
          '{tab} Q W E R T Y U I O P { } |',
          '{lock} A S D F G H J K L : " {enter}',
          '{shift} Z X C V B N M < > ? {shift}',
          '{toggleNumPad} {space} {toggleNumPad}',
        ],
        numPad: [
          '7 8 9',
          '4 5 6',
          '1 2 3',
          '0 . {bksp}',
          '{toggleDefault} {enter} {toggleDefault}',
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
      }}
      buttonTheme={[
        {
          class: 'bigger-keys',
          buttons: '{space}',
        },
      ]}
    />
  )
}

export default KeyboardWrapper
