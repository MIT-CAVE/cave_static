import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps }) => {
  console.log('data', data)
  const xLabels = R.pluck('name', data)
  const lineStat = data.map((item) => item.value[0])
  const barStat = data.map((item) => item.value[1])
  const labels = R.pluck('label')(labelProps)
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 1], data) ||
    R.any(R.equals('undefined'), labels)
  )
    return []
  const labelsExcludingUnits = R.map(R.replace(/\s*\[.*?\]/g, ''))(labels)
  const options = {
    xAxis: {
      type: 'category',
      data: xLabels,
      name: labels[0],
    },
    yAxis: [
      {
        type: 'value',
        name: labelsExcludingUnits[1],
      },
      {
        type: 'value',
        name: labelsExcludingUnits[2],
      },
    ],
    series: [
      {
        name: labelsExcludingUnits[1],
        type: 'line',
        data: lineStat,
        yAxisIndex: 0,
      },
      {
        name: labelsExcludingUnits[2],
        type: 'bar',
        data: barStat,
        yAxisIndex: 1,
      },
    ],
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
