import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import {
  NumberFormat,
  findColoring,
  getChartItemColor,
} from '../../../../utils'

// import { exampleNestedData } from './testData'

const Treemap = ({ data, colors, numberFormat }) => {
  const findNames = (data) =>
    R.has('children', R.head(data))
      ? R.map((d) => R.prepend(R.prop('name', d), findNames(d.children)), data)
      : R.pluck('name', data)
  const xLabels = R.pipe(findNames, R.flatten)(data)

  const assignColors = () => {
    const assignments = R.pipe(
      R.map((val) => {
        const randomChoice = getChartItemColor(val)
        return [val, randomChoice]
      }),
      R.fromPairs
    )(xLabels)
    return assignments
  }

  const assignments = assignColors()

  const processDeepData = (item) =>
    !R.has('children', R.head(item))
      ? R.map((obj) =>
          R.pipe(
            R.assocPath(
              ['itemStyle', 'color'],
              findColoring(obj.name, colors) ?? assignments[obj.name]
            ),
            R.assocPath(['label', 'rotate'], 0),
            R.assoc('visualMap', false)
          )(obj)
        )(item)
      : R.map((d) => ({
          name: d.name,
          itemStyle: {
            color: findColoring(d.name, colors) ?? assignments[d.name],
          },
          visualMap: false,
          label: { rotate: 0 },
          children: processDeepData(d.children),
        }))(item)

  const normalData = processDeepData(data)

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
    xAxis: null,
    yAxis: null,
    series: {
      label: {
        show: true,
      },
      itemStyle: {
        borderRadius: 10,
        borderColor: '#4a4a4a',
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
      data: normalData,
      // data: exampleNestedData,
      levels: [
        {
          itemStyle: {
            borderColor: '#4a4a4a',
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
      trigger: 'item',
      valueFormatter: (value) => NumberFormat.format(value, numberFormat),
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { Treemap }
