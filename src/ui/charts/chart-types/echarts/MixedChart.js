import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data }) => {
  console.log('data', data)
  const xLabels = R.pluck('name', data)
  const lineStat = data.map((item) => item.value[0])
  const barStat = data.map((item) => item.value[1])
  const options = {
    xAxis: {
      data: xLabels,
    },
    yAxis: [
      {
        type: 'value',
      },
      {
        type: 'value',
      },
    ],
    series: [
      {
        type: 'line',
        data: lineStat,
        yAxisIndex: 0,
      },
      {
        type: 'bar',
        data: barStat,
        yAxisIndex: 1,
      },
    ],
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
