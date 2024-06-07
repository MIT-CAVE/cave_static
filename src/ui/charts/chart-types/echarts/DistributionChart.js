import { Slider, Typography, Box } from '@mui/material'
import { styled } from '@mui/system'
import PropTypes from 'prop-types'
import { useState, useMemo } from 'react'

import EchartsPlot from './BaseChart'

const CustomSlider = styled(Slider)(() => ({
  '& .MuiSlider-valueLabel': {
    fontSize: '10px',
    padding: '3px 8px',
  },
}))

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
  chartType,
  stack = false,
  area = false,
}) => {
  const [numBuckets, setNumBuckets] = useState(10)

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
        seriesObj={area ? { areaStyle: { opacity: 1 }, smooth: !stack } : {}}
        xAxisTitle={yAxisTitle}
        {...{ numberFormat, stack, colors, xAxisTitle, yAxisTitle, chartType }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          width: '30%',
          left: '32%',
          top: '30px',
        }}
      >
        <Typography sx={{ whiteSpace: 'nowrap', mr: 2 }}>
          Number of buckets
        </Typography>
        <CustomSlider
          aria-label="bucket slider"
          valueLabelDisplay="auto"
          value={numBuckets}
          max={20}
          min={2}
          onChange={(e) => setNumBuckets(e.target.value)}
        ></CustomSlider>
      </Box>
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
