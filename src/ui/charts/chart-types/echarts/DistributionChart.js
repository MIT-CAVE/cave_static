import { Slider, Typography, Box } from '@mui/material'
import { styled } from '@mui/system'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState, useMemo } from 'react'

import EchartsPlot from './BaseChart'

import { findSubgroupLabels } from '../../../../utils'

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
  counts,
  stack = false,
  area = false,
}) => {
  const [numBuckets, setNumBuckets] = useState(10)

  const calcDistributionData = useMemo(() => {
    const hasSubgroups = R.has('children', R.head(data))
    if (hasSubgroups) {
      const values = R.flatten(
        data.map((obj) => R.pluck('value', obj.children))
      )
      const yValues = R.pluck('children', data)
      const flattenedYValues = R.flatten(yValues)
      const subGroupLabels = findSubgroupLabels(yValues)
      const subGroupCounts = {}
      for (const obj of flattenedYValues) {
        if (obj.name in subGroupCounts) {
          subGroupCounts[obj.name]++
        } else {
          subGroupCounts[obj.name] = 1
        }
      }

      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const range = maxValue - minValue
      const bucketSize = Math.ceil(range / numBuckets)
      const buckets = Array.from({ length: numBuckets }, () => {
        return subGroupLabels.reduce((acc, curr) => {
          acc[curr] = 0
          return acc
        }, {})
      })
      const bucketRanges = []
      for (let i = 0; i < numBuckets; i++) {
        const bucketMin = minValue + i * bucketSize
        const bucketMax = minValue + (i + 1) * bucketSize
        bucketRanges.push({
          min: bucketMin,
          max: bucketMax,
        })
      }

      for (const obj of flattenedYValues) {
        const bucketIndex = Math.min(
          Math.floor((obj.value[0] - minValue) / bucketSize),
          numBuckets - 1
        )
        buckets[bucketIndex][obj.name]++
      }

      if (cumulative) {
        const cumulativeCounts = []
        cumulativeCounts.push(buckets[0])
        for (let i = 1; i < buckets.length; i++) {
          const nextBucket = {}
          for (const subGroup of subGroupLabels) {
            nextBucket[subGroup] =
              buckets[i][subGroup] + cumulativeCounts[i - 1][subGroup]
          }
          cumulativeCounts.push(nextBucket)
        }

        const newData = bucketRanges.map((range, index) => {
          const dataItem = { name: `[${range.min},${range.max})`, children: [] }
          for (const [key, val] of Object.entries(cumulativeCounts[index])) {
            dataItem.children.push({
              name: key,
              value: counts ? [val] : [val / subGroupCounts[key]],
            })
          }
          return dataItem
        })
        return newData
      }

      const newData = bucketRanges.map((range, index) => {
        const dataItem = { name: `[${range.min},${range.max})`, children: [] }
        for (const [key, val] of Object.entries(buckets[index])) {
          dataItem.children.push({
            name: key,
            value: counts ? [val] : [val / subGroupCounts[key]],
          })
        }
        return dataItem
      })
      return newData
    } else {
      const values = [6, 5, -3, 1, -3, 4]
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const range = maxValue - minValue
      const bucketSize = Math.ceil(range / numBuckets)

      const buckets = new Array(numBuckets).fill(0)
      const bucketRanges = []

      for (let i = 0; i < numBuckets; i++) {
        const bucketMin = minValue + i * bucketSize
        const bucketMax = minValue + (i + 1) * bucketSize
        bucketRanges.push({
          min: bucketMin,
          max: bucketMax,
        })
      }

      // Add each value to a bucket
      values.forEach((val) => {
        const bucketIndex = Math.min(
          Math.floor((val - minValue) / bucketSize),
          numBuckets - 1
        )
        buckets[bucketIndex]++
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
          value: [
            counts
              ? cumulativeCounts[index]
              : cumulativeCounts[index] / values.length,
          ],
        }))
      }
      return bucketRanges.map((range, index) => ({
        name: `[${range.min},${range.max})`,
        value: [counts ? buckets[index] : buckets[index] / values.length],
      }))
    }
  }, [data, numBuckets, cumulative, counts])

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
          width: '25%',
          right: '10%',
          top: '25px',
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
        />
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
