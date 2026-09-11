import React from 'react'
import { expect, within, userEvent } from 'storybook/test'

import App from '../../App'

const initData = {
  settings: {
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
    sync: {
      launchedModal: {
        name: 'Launched Modal',
        showToggle: true,
        value: false,
        data: {
          lm1: ['panes', 'paneState', 'center'],
        },
      },
    },
  },
  appBar: {
    order: {
      data: ['exampleModal'],
    },
    data: {
      exampleModal: {
        icon: 'fa/FaSlidersH',
        type: 'pane',
        variant: 'modal',
        bar: 'upperLeft',
      },
    },
  },
  panes: {
    paneState: {
      center: {
        type: 'pane',
        open: 'exampleModal',
        pin: true,
      },
    },
    data: {
      exampleModal: {
        name: 'Example Modal',
        props: {
          exampleHeader: {
            name: 'Example Header',
            type: 'head',
            help: 'Some help for the Example Header',
          },
          numericInputExample: {
            name: 'Numeric Input Example',
            type: 'num',
            help: 'Help for the numeric input example',
            unit: 'widgets',
          },
        },
        values: {
          numericInputExample: 100,
        },
      },
    },
  },
}

const desyncedModalStories = {
  title: 'Workspaces/DesyncedModal',
  component: App,
  parameters: {
    initData,
    layout: 'fullscreen',
    layoutWidth: 'full',
  },
}

export default desyncedModalStories

export const CloseDesyncedModalInteraction = {
  render: () => <App />,
  play: async ({ canvasElement }) => {
    // 1. Initial State: Desynced modal is open with title "Example Modal"
    const body = within(document.body)
    const modalHeader = await body.findByText(
      'Example Modal',
      {},
      { timeout: 3000 }
    )
    expect(modalHeader).toBeDefined()

    // 2. Click the backdrop / modal root to close the modal
    const modalRoot = document.querySelector('.MuiModal-root')
    expect(modalRoot).not.toBeNull()
    await userEvent.click(modalRoot)

    // Wait for modal transition and state update
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 3. Verify that the modal has closed
    expect(body.queryByText('Example Modal')).toBeNull()

    // 4. Verify reopening the modal via app bar button
    const canvas = within(canvasElement)
    const buttons = await canvas.findAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    await userEvent.click(buttons[0])

    // Wait for modal transition and state update
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 5. Verify that the modal is open again
    expect(
      await body.findByText('Example Modal', {}, { timeout: 3000 })
    ).toBeDefined()
  },
}
