import { useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import './Keyboard.css'

const KeyboardWrapper = ({ keyboardRef, controlled, setInput, onChange }) => {
  const [layoutName, setLayoutName] = useState('default')
  const [prevButton, setPrevButton] = useState(null)

  const onKeyPress = (button) => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName(layoutName === 'default' ? 'shift' : 'default')
    } else if (prevButton === '{shift}' && layoutName === 'shift') {
      setLayoutName('default')
    }

    setPrevButton(button)
  }

  return (
    <Keyboard
      keyboardRef={(r) => (keyboardRef.current = r)}
      layoutName={layoutName}
      onChange={(value) => {
        controlled ? onChange(value) : setInput(value)
      }}
      onKeyPress={onKeyPress}
    />
  )
}

export default KeyboardWrapper
