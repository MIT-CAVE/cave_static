import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

import EchartsPlot from './BaseChart'

/**
 * Renders a distribution chart.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const DistributionChart = ({
  data,
  yAxisTitle,
  numberFormat,
  colors,
  stack = false,
  area = false,
}) => {
  const staticData = [
    { name: 'Michigan', value: [6] },
    { name: 'Ohio', value: [6] },
    { name: 'Illinois', value: [6] },
    { name: 'Florida', value: [-1] },
    { name: 'Massachusetts', value: [-6] },
    { name: 'Texas', value: [-6] },
    { name: 'Indiana', value: [-2] },
    { name: 'Ontario', value: [7.5] },
    { name: 'Maine', value: [10] },
  ]

  const [numBuckets, setNumBuckets] = useState(1)

  const values = staticData.map((val) => val.value[0])
  const minValue = Math.floor(Math.min(...values))
  const maxValue = Math.ceil(Math.max(...values))
  const range = maxValue - minValue
  const bucketSize = Math.ceil(range / numBuckets)

  const buckets = new Array(numBuckets).fill(0)
  const bucketRanges = []

  for (let i = 0; i < numBuckets; i++) {
    bucketRanges.push({
      min: minValue + i * bucketSize,
      max: minValue + (i + 1) * bucketSize,
    })
  }

  for (const val of values) {
    const bucketIndex = Math.min(
      Math.floor((val - minValue) / bucketSize),
      numBuckets - 1
    )
    buckets[bucketIndex]++
  }

  const newData = bucketRanges.map((range, index) => ({
    name: `[${range.min},${range.max})`,
    value: buckets[index] / values.length,
  }))

  console.log('data', data)
  console.log('new data', newData)

  return (
    <>
      <EchartsPlot
        data={newData}
        chartType="bar"
        xAxisTitle={yAxisTitle}
        yAxisTitle="Probability Density"
        seriesObj={area ? { areaStyle: { opacity: 1 }, smooth: !stack } : {}}
        {...{ numberFormat, stack, colors }}
      />
      <Slider
        aria-label="bucket slider"
        valueLabelDisplay="on"
        value={numBuckets}
        sx={{ position: 'absolute', width: '30%', left: '35%', top: '1%' }}
        max={20}
        min={1}
        onChange={(e) => setNumBuckets(e.target.value)}
      ></Slider>
    </>
  )
}
DistributionChart.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  area: PropTypes.bool,
}

export { DistributionChart }
