import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { expect, waitFor, within } from 'storybook/test'

import ChartControls from '../../ui/charts/chart-types/echarts/ChartControls'

const mockStore = configureStore({
  reducer: {
    data: (state = {}) => state,
    local: (state = {}) => state,
    utilities: (state = {}) => state,
  },
})

const chartControlsStories = {
  title: 'Charts/ChartControls',
  component: ChartControls,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <Story />
      </Provider>
    ),
  ],
  parameters: { layoutWidth: 'full' },
}

export default chartControlsStories

// The longest label of the dropdown is shown in full, instead of marqueeing
export const SortByLabelDoesNotScroll = {
  args: {
    sortable: true,
    path: ['pages', 'data', 'page', 'charts', 'chart'],
    xAxisOrder: 'alpha_descending',
  },
  play: async ({ canvasElement }) => {
    const select = await within(canvasElement).findByRole('combobox')
    // The label is the last child of the value, which has the marquee first
    const label = select.firstElementChild.lastElementChild
    const marquee = label.firstElementChild
    await waitFor(() =>
      expect(getComputedStyle(label.lastElementChild).display).not.toBe('none')
    )
    await expect(getComputedStyle(marquee).display).toBe('none')
    await expect(label.lastElementChild.textContent).toBe('Name (Desc)')
  },
}
