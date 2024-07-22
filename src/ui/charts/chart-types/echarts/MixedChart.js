import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps }) => {
  const xLabels = R.pluck('name', data)
  const [lineData, barData] = R.pipe(R.pluck('value'), R.transpose)(data)
  const labels = R.pluck('label')(labelProps)

  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 1], data) ||
    R.any(R.equals('undefined'), labels)
  )
    return []

  const [xAxisLabel, lineLabel, barLabel] = R.pipe(
    R.map(R.replace(/\s*\[.*?\]/g, '')),
    R.take(3)
  )(labels)

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
    series: [
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
    ],
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
