import React from 'react'

import ChartTypeSelector from '../../../ui/views/dashboard/ChartTypeSelector'
import { chartOption } from '../../../utils/enums'

const chartTypeSelectorStories = {
  title: 'Views/Dashboard/ChartTypeSelector',
  component: ChartTypeSelector,
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '200px',
  },
}

export default chartTypeSelectorStories

const GROUPED_OUTPUT_OPTIONS = [
  chartOption.BAR,
  chartOption.STACKED_BAR,
  chartOption.LINE,
  chartOption.CUMULATIVE_LINE,
  chartOption.AREA,
  chartOption.STACKED_AREA,
  chartOption.WATERFALL,
  chartOption.STACKED_WATERFALL,
  chartOption.BOX_PLOT,
  chartOption.TABLE,
  chartOption.SUNBURST,
  chartOption.TREEMAP,
  chartOption.GAUGE,
  chartOption.HEATMAP,
  chartOption.SCATTER,
  chartOption.DISTRIBUTION,
  chartOption.MIXED,
]

const GLOBAL_OUTPUT_OPTIONS = [
  chartOption.BAR,
  chartOption.LINE,
  chartOption.TABLE,
  chartOption.OVERVIEW,
]

export const GroupedOutputOptions = {
  render: function Render(args) {
    const [value, setValue] = React.useState(args.value)
    return (
      <ChartTypeSelector
        {...args}
        value={value}
        onChange={(val) => {
          args.onChange(val)
          setValue(val)
        }}
      />
    )
  },
  args: {
    value: 'bar',
    chartOptions: GROUPED_OUTPUT_OPTIONS,
    onChange: () => {},
  },
}

export const GlobalOutputOptions = {
  render: function Render(args) {
    const [value, setValue] = React.useState(args.value)
    return (
      <ChartTypeSelector
        {...args}
        value={value}
        onChange={(val) => {
          args.onChange(val)
          setValue(val)
        }}
      />
    )
  },
  args: {
    value: 'bar',
    chartOptions: GLOBAL_OUTPUT_OPTIONS,
    onChange: () => {},
  },
}
