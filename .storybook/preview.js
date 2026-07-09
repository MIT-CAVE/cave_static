import React from 'react'
import { Provider } from 'react-redux'

import { store } from '../src/utils/store'

const layoutDecorator = (Story, context) => {
  const width = context.parameters.layoutWidth ?? '400px'
  if (width === 'full') return React.createElement(Story)
  return React.createElement(
    'div',
    {
      style: {
        maxWidth: width,
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        boxSizing: 'border-box',
      },
    },
    React.createElement(Story)
  )
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [
    (Story) =>
      React.createElement(Provider, { store }, React.createElement(Story)),
    layoutDecorator,
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
