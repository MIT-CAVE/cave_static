import React from 'react'
import { expect, within, userEvent, fireEvent, waitFor } from 'storybook/test'

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

    // 2. Click the modal backdrop to close the modal
    const modalBackdrop = document.querySelector(
      '.MuiModal-root .MuiBackdrop-root'
    )
    expect(modalBackdrop).not.toBeNull()
    fireEvent.click(modalBackdrop)

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
    // (scoped to the modal, since the app bar button tooltip shows the same name)
    await waitFor(
      () =>
        expect(
          within(document.querySelector('.MuiModal-root')).getByText(
            'Example Modal'
          )
        ).toBeDefined(),
      { timeout: 3000 }
    )
  },
}

export const ClickAppBarClosesModalAndOpensPane = {
  parameters: {
    initData: {
      ...initData,
      appBar: {
        order: {
          data: ['exampleModal', 'examplePane'],
        },
        data: {
          ...initData.appBar.data,
          examplePane: {
            icon: 'fa/FaCog',
            type: 'pane',
            bar: 'upperLeft',
          },
        },
      },
      panes: {
        ...initData.panes,
        data: {
          ...initData.panes.data,
          examplePane: {
            name: 'Example Pane',
            props: {},
            values: {},
          },
        },
      },
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Scope to the modal root: the AppBar tooltip repeats the modal's name
    const modalRoot = () => document.querySelector('.MuiModal-root')
    const expectModalOpen = () =>
      waitFor(() => expect(modalRoot()).not.toBeNull(), { timeout: 3000 })
    const expectModalClosed = () =>
      waitFor(() => expect(modalRoot()).toBeNull(), { timeout: 3000 })

    // 1. Initial State: Modal is open
    await expectModalOpen()

    // 2. Click the same modal's AppBar button -> modal closes (and stays closed)
    // The AppBar is `aria-hidden` while a modal is open, so include hidden nodes
    const modalBtn = await canvas.findByRole('button', {
      name: 'Example Modal',
      hidden: true,
    })
    await userEvent.click(modalBtn)
    await expectModalClosed()

    // 3. Reopen the modal, then click the wall pane's AppBar button ->
    //    modal closes AND the wall pane opens
    await userEvent.click(modalBtn)
    await expectModalOpen()

    const paneTab = await canvas.findByRole('tab', {
      name: 'Example Pane',
      hidden: true,
    })
    await userEvent.click(paneTab)
    await expectModalClosed()
    await waitFor(
      () => expect(paneTab).toHaveAttribute('aria-selected', 'true'),
      {
        timeout: 3000,
      }
    )
  },
}
