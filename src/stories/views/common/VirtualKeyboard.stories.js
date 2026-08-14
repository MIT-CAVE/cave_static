import React from 'react'

import VirtualKeyboard from '../../../ui/views/common/VirtualKeyboard'

const virtualKeyboardStories = {
  title: 'Views/Common/VirtualKeyboard',
  component: VirtualKeyboard,
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '600px',
    hideGlobalKeyboard: true,
  },
}

export default virtualKeyboardStories

export const Default = {
  render: () => <VirtualKeyboard />,
  parameters: {
    preloadedState: {
      utilities: {
        virtualKeyboard: {
          isOpen: true,
          layout: 'default',
          inputValue: 'Hello World',
          caretPosition: [11, 11],
          isTextArea: false,
        },
      },
    },
  },
}

export const NumPad = {
  render: () => <VirtualKeyboard />,
  parameters: {
    preloadedState: {
      utilities: {
        virtualKeyboard: {
          isOpen: true,
          layout: 'numPad',
          inputValue: '123.45',
          caretPosition: [6, 6],
          isTextArea: false,
        },
      },
    },
  },
}
