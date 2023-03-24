import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { renameKeys } from '../../../../utils'
import { CHART_PALETTE } from '../../../../utils/constants'
// import { exampleNestedData } from './testData'

const Sunburst = ({ data, theme, subGrouped }) => {
  const yData = R.pluck('y')(data)
  let yKeys = R.pipe(R.mergeAll, R.keys)(yData)
  const allKeys = R.pluck('x')(data).concat(yKeys)

  const assignColors = () => {
    let availableColors =
      theme === 'dark' ? CHART_PALETTE.dark : CHART_PALETTE.light
    // availableColors = R.without(['#4992ff'], availableColors)

    // TODO: Random colors must be dropped in 1.4.0
    const assignments = R.pipe(
      R.map((val) => {
        let randomChoice =
          availableColors[Math.floor(Math.random() * availableColors.length)]
        availableColors = R.without([randomChoice], availableColors)
        return [val, randomChoice]
      }),
      R.fromPairs
    )(allKeys)
    return assignments
  }

  let assignments = assignColors()

  let normalData = R.map((obj) =>
    R.pipe(
      renameKeys({ x: 'name', y: 'value' }),
      R.assocPath(['itemStyle', 'color'], assignments[obj.name])
    )(obj)
  )(data)

  const createDatum = (obj) => {
    let keys = R.keys(obj.y)
    return {
      name: obj.x,
      visualMap: false,
      itemStyle: { color: assignments[obj.x] },
      children: R.map((key) => ({
        value: Math.abs(obj.y[key]),
        name: key,
        itemStyle: { color: assignments[key] },
        visualMap: false,
      }))(keys),
    }
  }
  // console.log(R.map(createDatum, data))
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
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
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
      data: subGrouped ? R.map(createDatum, data) : normalData,
      // data: exampleNestedData
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
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
            lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export { Sunburst }