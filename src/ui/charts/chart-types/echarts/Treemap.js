import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { CHART_PALETTE } from '../../../../utils/constants'
// import { exampleNestedData } from './testData'

const Treemap = ({ data, theme, subGrouped }) => {
  const renameKeys = R.curry((keysMap, obj) =>
    R.reduce(
      (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
      {},
      R.keys(obj)
    )
  )
  const yData = R.pluck('y')(data)
  let yKeys = R.pipe(R.mergeAll, R.keys)(yData)
  const allKeys = R.pluck('x')(data).concat(yKeys)

  const assignColors = () => {
    let availableColors =
      theme === 'dark' ? CHART_PALETTE.dark : CHART_PALETTE.light
    // availableColors = R.without(['#4992ff'], availableColors)
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

  let normalData = R.pipe(
    R.map(renameKeys({ x: 'name' })),
    R.map(renameKeys({ y: 'value' })),
    R.map((obj) =>
      R.assoc(
        'itemStyle',
        { color: R.path([R.path(['name'], obj)], assignments) },
        obj
      )
    )
  )(data)

  const createDatum = (obj) => {
    let base = { name: R.path('x', obj), children: [], visualMap: false }
    let keys = R.keysIn(R.path('y', obj))
    base = R.assoc(
      'children',
      R.map(
        (key) =>
          R.assoc(
            'value',
            Math.abs(R.path(['y', key], obj)),
            R.assoc(
              'name',
              key,
              // R.assoc(
              //   'itemStyle',
              //   { color: R.path([key], assignments) },
              //   R.assoc('visualMap', false, {})
              // )
              {}
            )
          ),
        keys
      ),
      base
    )
    base = R.assoc(
      'itemStyle',
      { color: R.path([R.path('x', obj)], assignments) },
      base
    )
    return base
  }

  const options = {
    // visualMap: subGrouped
    //   ? {
    //       type: 'piecewise',
    //       categories: yKeys,
    //       showLabel: 'true',
    //       inRange: {
    //         color: R.map((val) => R.path([val], assignments), yKeys),
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
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    series: {
      label: {
        show: true,
      },
      itemStyle: {
        borderRadius: 10,
        borderColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
        borderWidth: 2,
        gapWidth: 2,
      },
      textStyle: {
        fontSize: 50,
      },
      type: 'treemap',
      sort: undefined,
      leafDepth: 2,
      roam: false,
      colorAlpha: [0.8, 1],
      data: subGrouped ? R.map(createDatum, data) : normalData,
      // data: exampleNestedData,
      levels: [
        {
          itemStyle: {
            borderColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
            borderWidth: 2,
            gapWidth: 2,
          },
        },
        {
          colorSaturation: [0.7, 1],
        },
        {
          itemStyle: {
            borderColorSaturation: 0.3,
            gapWidth: 2,
            borderWidth: 2,
          },
        },
        // {
        //   colorSaturation: [0.3, 0.5],
        //   itemStyle: {
        //     borderColorSaturation: 0.6,
        //     gapWidth: 2
        //   }
        // },
        // {
        //   colorSaturation: [0.3, 0.5]
        // }
      ],
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

export { Treemap }
