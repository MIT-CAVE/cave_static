import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

import EchartsPlot from './BaseChart'

/**
 * Renders a cumulative distribution chart.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const CumulativeDistributionChart = ({
  data,
  yAxisTitle,
  numberFormat,
  colors,
  stack = false,
  area = false,
}) => {
  //   const staticData = [
  //     { name: 'Michigan', value: [6] },
  //     { name: 'Ohio', value: [6] },
  //     { name: 'Illinois', value: [6] },
  //     { name: 'Florida', value: [-1] },
  //     { name: 'Massachusetts', value: [-6] },
  //     { name: 'Texas', value: [-6] },
  //     { name: 'Indiana', value: [-2] },
  //     { name: 'Ontario', value: [7.5] },
  //     { name: 'Maine', value: [10] },
  //   ]

  const [numBuckets, setNumBuckets] = useState(1)

  const values = data.map((val) => val.value[0])
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

  // Add each value to a bucket
  values.forEach((val) => {
    buckets[
      Math.min(Math.floor((val - minValue) / bucketSize), numBuckets - 1)
    ]++
  })

  // Calculate the cumulative counts for CDF
  const cumulativeCounts = buckets.reduce((acc, count, index) => {
    const cumulativeCount = index === 0 ? count : acc[index - 1] + count
    acc.push(cumulativeCount)
    return acc
  }, [])

  const newData = bucketRanges.map((range, index) => ({
    name: `[${range.min},${range.max})`,
    value: cumulativeCounts[index] / values.length,
  }))

  return (
    <>
      <EchartsPlot
        data={newData}
        chartType="bar"
        xAxisTitle={yAxisTitle}
        yAxisTitle="Cumulative Density"
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
CumulativeDistributionChart.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  area: PropTypes.bool,
}

export { CumulativeDistributionChart }
