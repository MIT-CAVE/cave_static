import React from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import AppBar from '../../../ui/views/common/AppBar'

const appBarStories = {
  title: 'Views/Common/AppBar',
  component: AppBar,
  parameters: {
    layoutWidth: '160px',
    layoutHeight: '520px',
  },
}

export default appBarStories

// One item of each type: built-in panes, a custom pane, a page, and a button
const appBar = {
  upperLeft: {
    session: { bar: 'upperLeft', icon: 'md/MdApi', type: 'session' },
    settings: {
      bar: 'upperLeft',
      icon: 'md/MdOutlineSettings',
      type: 'settings',
    },
    filterPane: { bar: 'upperLeft', icon: 'md/MdFilterAlt', type: 'pane' },
    mapPage: { bar: 'upperLeft', icon: 'md/MdMap', type: 'page' },
  },
  lowerLeft: {
    myCommandButton: {
      bar: 'lowerLeft',
      icon: 'md/MdBolt',
      type: 'button',
      apiCommand: 'myCommand',
    },
  },
}

export const Default = {
  render: () => (
    <AppBar
      {...{ appBar }}
      open={false}
      pin={false}
      side="left"
      source="left"
    />
  ),
  parameters: {
    initData: {
      panes: { data: { filterPane: { name: 'Filters', props: {} } } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Pane items use the pane name, other items fall back to their key
    await expect(canvas.getByRole('tab', { name: 'Session' })).toBeVisible()
    await expect(canvas.getByRole('tab', { name: 'Settings' })).toBeVisible()
    await expect(canvas.getByRole('tab', { name: 'Filters' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'mapPage' })).toBeVisible()
    const button = canvas.getByRole('button', { name: 'myCommandButton' })
    await expect(button).toBeVisible()

    await userEvent.hover(button)
    await waitFor(() =>
      expect(
        within(document.body).getByRole('tooltip', { name: 'myCommandButton' })
      ).toBeVisible()
    )
  },
}
