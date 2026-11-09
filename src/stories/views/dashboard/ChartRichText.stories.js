import { expect, waitFor, within } from 'storybook/test'

import GroupsFilter from '../../../ui/views/common/GroupsFilter'
import GroupedOutputsToolbar from '../../../ui/views/dashboard/GroupedOutputsToolbar'

const chartRichTextStories = {
  title: 'Views/Dashboard/RichText',
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '600px',
  },
}

export default chartRichTextStories

// The `richText` cascade of the names of a chart: for a stat `stat` > `dataset`,
// for a grouping `level` > `grouping`, and `settings.defaults` as their root
const buildState = ({
  defaults,
  dataset = {},
  sales = {},
  grouping = {},
  state = {},
} = {}) => ({
  settings: { ...(defaults && { defaults }) },
  groupedOutputs: {
    groupings: {
      location: {
        name: '**Location**',
        ...grouping,
        data: {
          id: ['UsMi', 'UsMa'],
          country: ['USA', 'USA'],
          state: ['Michigan', 'Massachusetts'],
        },
        levels: {
          country: { name: 'Country' },
          state: { name: '_State_', parent: 'country', ...state },
        },
      },
    },
    data: {
      salesData: {
        ...dataset,
        stats: {
          sales: { name: '**Sales**', unit: 'units', ...sales },
        },
        valueLists: { sales: [1, 2] },
        groupLists: { location: ['UsMi', 'UsMa'] },
      },
    },
  },
  pages: {
    currentPage: 'page_1',
    data: {
      page_1: {
        charts: {
          chart_1: {
            type: 'groupedOutput',
            chartType: 'bar',
            dataset: 'salesData',
            stats: [{ statId: 'sales', aggregationType: 'sum' }],
            groupingId: ['location'],
            groupingLevel: ['state'],
          },
        },
      },
    },
  },
})

const toolbar = (options) => ({
  render: () => <GroupedOutputsToolbar index="chart_1" />,
  parameters: { preloadedState: { data: buildState(options) } },
})

// Names are shown twice by `OverflowText` (the marquee and the text), so every
// element with the text is checked
const expectAll = async (canvas, text, tagName) => {
  const elements = await canvas.findAllByText(text)
  await expect(elements.length).toBeGreaterThan(0)
  for (const element of elements) await expect(element.tagName).toBe(tagName)
}

export const NamesArePlainByDefault = {
  ...toolbar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText(/\*\*Sales\*\*/).length).toBeGreaterThan(0)
    )
    await expect(canvasElement.querySelector('strong')).toBeNull()
  },
}

export const StatAndGroupingFollowTheirDataset = {
  ...toolbar({ dataset: { richText: true }, grouping: { richText: true } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectAll(canvas, 'Sales', 'STRONG')
    // The level inherits the grouping
    await expectAll(canvas, 'State', 'EM')
  },
}

export const StatOverridesItsDataset = {
  ...toolbar({ dataset: { richText: true }, sales: { richText: false } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText(/\*\*Sales\*\*/).length).toBeGreaterThan(0)
    )
  },
}

export const LevelOverridesItsGrouping = {
  ...toolbar({
    defaults: { richText: true },
    grouping: { richText: true },
    state: { richText: false },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText(/_State_/).length).toBeGreaterThan(0)
    )
    await expectAll(canvas, 'Location', 'STRONG')
  },
}

export const GlobalDefaultMakesNamesRich = {
  ...toolbar({ defaults: { richText: true } }),
  play: async ({ canvasElement }) => {
    await expectAll(within(canvasElement), 'Sales', 'STRONG')
  },
}

export const GroupsFilterNamesAreRich = {
  render: () => <GroupsFilter defaultFilters={[]} onSave={() => {}} />,
  parameters: {
    preloadedState: {
      data: buildState({ grouping: { richText: true } }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectAll(canvas, 'Location', 'STRONG')
  },
}
