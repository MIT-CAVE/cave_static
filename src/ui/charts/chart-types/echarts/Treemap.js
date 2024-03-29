import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { findSubgroupLabels } from '../../../../utils'
import { CHART_PALETTE } from '../../../../utils/constants'

// import { exampleNestedData } from './testData'

const Treemap = ({ data, colors }) => {
  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const assignColors = () => {
    let availableColors = CHART_PALETTE

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

  const assignments = R.mergeRight(assignColors(), colors)

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
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { Treemap }
