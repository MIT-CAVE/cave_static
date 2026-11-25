import * as R from 'ramda'
import { useContext } from 'react'

import { FlexibleChart } from './BaseChart'
import ChartContext, { useValueDisplayName } from './ChartContext'

import {
  NumberFormat,
  findColoring,
  getChartItemColor,
  resolveNumberFormat,
} from '../../../../utils'
import { markup, safeHtml } from '../../../../utils/html'

// import { exampleNestedData } from './testData'

const Treemap = ({ data, colors, numberFormat = {} }) => {
  const getDisplayName = useValueDisplayName()
  const { title } = useContext(ChartContext)
  if (R.isNil(data) || R.isEmpty(data)) return []

  const findNames = (data) =>
    data && data.length > 0 && R.has('children', R.head(data))
      ? R.map(
          (d) => R.prepend(R.prop('name', d), findNames(d?.children || [])),
          data
        )
      : R.pluck('name', data || [])
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
      // ECharts leaves 50px above the treemap by default (and 50px below, which
      // keeps clear of the breadcrumb). Match the 20px side margins when there
      // is a title above the chart so they appear together.
      ...(title && { top: 20 }),
      label: {
        show: true,
        formatter: ({ name }) => getDisplayName(name),
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
      formatter: ({ marker, name, value }) =>
        markup`${safeHtml(marker)} ${getDisplayName(name)}: <strong>${NumberFormat.format(
          value,
          resolveNumberFormat(numberFormat)
        )}</strong>`.toString(),
    },
  }

  return <FlexibleChart sortable {...{ options }} />
}

export { Treemap }
