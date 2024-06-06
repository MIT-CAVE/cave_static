import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import { useState, useMemo } from 'react'

import EchartsPlot from './BaseChart'

/**
 * Renders a distribution chart.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const DistributionChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
  cumulative,
  stack = false,
  area = false,
}) => {
  const [numBuckets, setNumBuckets] = useState(1)

  const calcDistributionData = useMemo(() => {
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

    if (cumulative) {
      // Calculate the cumulative counts for CDF
      const cumulativeCounts = buckets.reduce((acc, count, index) => {
        const cumulativeCount = index === 0 ? count : acc[index - 1] + count
        acc.push(cumulativeCount)
        return acc
      }, [])

      return bucketRanges.map((range, index) => ({
        name: `[${range.min},${range.max})`,
        value: cumulativeCounts[index] / values.length,
      }))
    }

    return bucketRanges.map((range, index) => ({
      name: `[${range.min},${range.max})`,
      value: buckets[index] / values.length,
    }))
  }, [data, numBuckets, cumulative])

  return (
    <>
      <EchartsPlot
        data={calcDistributionData}
        chartType="bar"
        seriesObj={area ? { areaStyle: { opacity: 1 }, smooth: !stack } : {}}
        {...{ numberFormat, stack, colors, xAxisTitle, yAxisTitle }}
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
  cumulative: PropTypes.bool,
  stack: PropTypes.bool,
  area: PropTypes.bool,
}

export { DistributionChart }
