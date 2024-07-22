import * as R from 'ramda'
import { useMemo } from 'react'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps, leftVariant, rightVariant }) => {
  const hasSubgroups = R.has('children', R.head(data))
  const xLabels = R.pluck('name', data)
  const labels = R.pluck('label')(labelProps)
  const [xAxisLabel, lineLabel, barLabel] = hasSubgroups
    ? R.props([0, 2, 3])(labels)
    : R.take(3)(labels)

  const { series, min, max } = useMemo(() => {
    const variantType = {
      line: 'line',
      'cumulative line': 'line',
      bar: 'bar',
      'stacked bar': 'bar',
    }

    if (hasSubgroups) {
      const subGroups = R.reduce(
        (acc, item) => {
          R.forEach((child) => {
            if (!R.find((sg) => sg.name === child.name, acc)) {
              acc.push({ name: child.name, lineData: [], barData: [] })
            }
          }, item.children)
          return acc
        },
        [],
        data
      )

      R.forEach((item) => {
        R.forEach((subgroup) => {
          const child = R.find(
            (child) => child.name === subgroup.name,
            item.children
          )
          subgroup.lineData.push(child ? child.value[0] : null)
          subgroup.barData.push(child ? child.value[1] : null)
        }, subGroups)
      }, data)

      const lineData = R.chain(R.prop('lineData'), subGroups)
      const barData = R.chain(R.prop('barData'), subGroups)

      return {
        series: R.flatten([
          subGroups.map((sg) => ({
            name: `${R.replace(/\s*\[.*?\]/g, '')(lineLabel)}: ${sg.name}`,
            type: variantType[leftVariant],
            data: sg.lineData,
            yAxisIndex: 0,
          })),
          subGroups.map((sg) => ({
            name: `${R.replace(/\s*\[.*?\]/g, '')(barLabel)}: ${sg.name}`,
            type: variantType[rightVariant],
            data: sg.barData,
            yAxisIndex: 1,
          })),
        ]),
        min: Math.min(...lineData, ...barData),
        max: Math.max(...lineData, ...barData),
      }
    } else {
      const [lineData, barData] = R.pipe(R.pluck('value'), R.transpose)(data)
      return {
        series: [
          {
            name: R.replace(/\s*\[.*?\]/g, '')(lineLabel),
            type: variantType[leftVariant],
            data: lineData,
            yAxisIndex: 0,
          },
          {
            name: R.replace(/\s*\[.*?\]/g, '')(barLabel),
            type: variantType[rightVariant],
            data: barData,
            yAxisIndex: 1,
          },
        ],
        min: Math.min(...lineData, ...barData),
        max: Math.max(...lineData, ...barData),
      }
    }
  }, [barLabel, data, hasSubgroups, lineLabel, leftVariant, rightVariant])

  const createYAxis = (name, rotate) => ({
    type: 'value',
    name,
    nameGap: 50,
    min: min,
    max: max,
    nameLocation: 'middle',
    nameRotate: rotate,
    nameTextStyle: {
      fontSize: 18,
      height: 500,
    },
    axisLine: {
      show: true,
    },
  })

  const options = {
    xAxis: {
      type: 'category',
      data: xLabels,
      name: xAxisLabel,
    },
    yAxis: [createYAxis(lineLabel, 90), createYAxis(barLabel, -90)],
    series,
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
