import * as R from 'ramda'
import { useMemo } from 'react'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps }) => {
  const hasSubgroups = R.has('children', R.head(data))
  const xLabels = R.pluck('name', data)
  const labels = R.pluck('label')(labelProps)
  const [xAxisLabel, lineLabel, barLabel] = R.pipe(
    R.map(R.replace(/\s*\[.*?\]/g, '')),
    hasSubgroups ? R.props([0, 2, 3]) : R.take(3)
  )(labels)

  const series = useMemo(() => {
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

      return R.flatten([
        subGroups.map((sg) => ({
          name: `${lineLabel}: ${sg.name}`,
          type: 'line',
          data: sg.lineData,
          yAxisIndex: 0,
        })),
        subGroups.map((sg) => ({
          name: `${barLabel}: ${sg.name}`,
          type: 'bar',
          data: sg.barData,
          yAxisIndex: 1,
        })),
      ])
    } else {
      const [lineData, barData] = R.pipe(R.pluck('value'), R.transpose)(data)
      return [
        {
          name: lineLabel,
          type: 'line',
          data: lineData,
          yAxisIndex: 0,
        },
        {
          name: barLabel,
          type: 'bar',
          data: barData,
          yAxisIndex: 1,
        },
      ]
    }
  }, [barLabel, data, hasSubgroups, lineLabel])

  const createYAxis = (name, rotate) => ({
    type: 'value',
    name,
    nameGap: 50,
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
