import React from 'react'
import { Provider } from 'react-redux'
import PropTypes from 'prop-types'

import { createMockStore, CaveAppWrapper } from './base'

const MockStoreProvider = ({ initData, children }) => {
  const storeRef = React.useRef()
  if (!storeRef.current) {
    storeRef.current = createMockStore(initData)
  }
  return React.createElement(Provider, { store: storeRef.current }, children)
}
MockStoreProvider.propTypes = {
  initData: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
}

const globalMockDecorator = (Story, context) => {
  const initData = context.parameters.initData ?? {}
  const isFull = context.parameters.layoutWidth === 'full'

  const parseDimension = (val, defaultVal) => {
    if (val === undefined || val === null) return defaultVal
    if (typeof val === 'number') return `${val}px`
    return val
  }

  const width = parseDimension(context.parameters.layoutWidth, '600px')
  const height = parseDimension(context.parameters.layoutHeight, '600px')

  const content = isFull
    ? React.createElement(Story)
    : React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            boxSizing: 'border-box',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              position: 'relative',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              boxSizing: 'border-box',
              width,
              height,
              overflow: 'auto',
            },
          },
          React.createElement(Story)
        )
      )

  return React.createElement(
    MockStoreProvider,
    { initData },
    React.createElement(CaveAppWrapper, null, content)
  )
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [globalMockDecorator],
  parameters: {
    layout: 'fullscreen',
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
