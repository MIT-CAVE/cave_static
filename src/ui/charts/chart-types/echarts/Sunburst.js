import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { findSubgroupLabels } from '../../../../utils'
import { CHART_PALETTE } from '../../../../utils/constants'
// import { exampleNestedData } from './testData'

const Sunburst = ({ data, theme }) => {
  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const assignColors = () => {
    let availableColors =
      theme === 'dark' ? CHART_PALETTE.dark : CHART_PALETTE.light

    const assignments = R.pipe(
      R.map((val) => {
        let randomChoice =
          availableColors[Math.floor(Math.random() * availableColors.length)]
        availableColors = R.without([randomChoice], availableColors)
        return [val, randomChoice]
      }),
      R.fromPairs
    )(R.concat(xLabels, subGroupLabels))
    return assignments
  }

  const assignments = assignColors()

  const normalData = R.isEmpty(subGroupLabels)
    ? R.map((obj) =>
        R.pipe(R.assocPath(['itemStyle', 'color'], assignments[obj.name]))(obj)
      )(data)
    : R.map((d) => ({
        name: d.name,
        itemStyle: { color: assignments[d.name] },
        visualMap: false,
        children: R.map((child) => ({
          value: child.value,
          name: child.name,
          itemStyle: { color: assignments[child.name] },
          visualMap: false,
        }))(d.children),
      }))(data)

  const options = {
    // visualMap: subGrouped
    //   ? {
    //       type: 'piecewise',
    //       categories: yKeys,
    //       showLabel: 'true',
    //       inRange: {
    //         color: R.map((val) => R.path([val], assignments), allKeys),
    //       },
    //       itemWidth: 20,
    //       itemHeight: 20,
    //       top: '5%',
    //       right: '3%',
    //       textStyle: {
    //         fontSize: 20,
    //       },
    //     }
    //   : null,
    // : {
    //     type: 'piecewise',
    //     categories: allKeys,
    //     showLabel: 'true',
    //     inRange: {
    //       color: R.map((val) => R.path([val], assignments), allKeys),
    //     },
    //     itemWidth: 20,
    //     itemHeight: 20,
    //     top: '5%',
    //     right: '3%',
    //     textStyle: {
    //       fontSize: 20,
    //     },
    //   },
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#f5f5f5',
    series: {
      radius: [60, '90%'],
      label: {
        show: true,
      },
      precision: 2,
      itemStyle: {
        borderRadius: 7,
        borderWidth: 1,
      },
      colorAlpha: [0.8, 1],
      type: 'sunburst',
      sort: undefined,
      data: normalData,
      // data: exampleNestedData
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#f5f5f5',
      trigger: 'item',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
  }

  return (
    <div style={{ flex: '1 1 auto' }}>
      <AutoSizer>
        {({ height, width }) => (
          <ReactEChartsCore
            echarts={echarts}
            option={options}
            style={{ height, width }}
            theme={theme}
            notMerge
            // lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export { Sunburst }
