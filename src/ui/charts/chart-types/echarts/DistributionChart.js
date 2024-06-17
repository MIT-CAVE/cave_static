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
    const values = hasSubgroups
      ? R.flatten(data.map((obj) => R.pluck('value', obj.children)))
      : data.map((val) => val.value[0])
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    const bucketSize = Math.ceil(range / numBuckets)

    // initialize array with bucket ranges
    const bucketRanges = R.times(
      (i) => ({
        min: minValue + i * bucketSize,
        max: minValue + (i + 1) * bucketSize,
      }),
      numBuckets
    )

    if (hasSubgroups) {
      const yValues = R.pluck('children', data)
      const flattenedYValues = R.flatten(yValues)
      const subGroupLabels = findSubgroupLabels(yValues)
      const subGroupCounts = R.countBy(R.prop('name'), flattenedYValues)

      // initialize buckets, setting all subGroup counts to 0
      const buckets = R.times(
        () => R.fromPairs(R.map((label) => [label, 0], subGroupLabels)),
        numBuckets
      )

      // add each data object to corresponding bucket
      R.forEach((obj) => {
        buckets[
          Math.min(
            Math.floor((obj.value[0] - minValue) / bucketSize),
            numBuckets - 1
          )
        ][obj.name]++
      }, flattenedYValues)

      // calculate final buckets based on PDF/CDF
      const finalBuckets = cumulative
        ? R.reduce(
            (acc, currentBucket) =>
              R.append(
                R.isEmpty(acc)
                  ? currentBucket
                  : R.mergeWith(R.add, currentBucket, R.last(acc)),
                acc
              ),
            [],
            buckets
          )
        : buckets

      // return new data
      return R.addIndex(R.map)(
        (range, index) => ({
          name: `[${range.min},${range.max})`,
          children: R.pipe(
            R.toPairs,
            R.map(([key, val]) => ({
              name: key,
              value: counts ? [val] : [val / subGroupCounts[key]],
            }))
          )(finalBuckets[index]),
        }),
        bucketRanges
      )
    } else {
      // initialize buckets and add each value to corresponding bucket
      const buckets = new Array(numBuckets).fill(0)
      R.forEach((val) => {
        buckets[
          Math.min(Math.floor((val - minValue) / bucketSize), numBuckets - 1)
        ]++
      }, values)

      // calculate final buckets based on PDF/CDF
      const finalBuckets = cumulative
        ? R.scan(R.add, 0, buckets).slice(1)
        : buckets

      // return new data
      return R.addIndex(R.map)(
        (range, index) => ({
          name: `[${range.min},${range.max})`,
          value: [
            counts ? finalBuckets[index] : finalBuckets[index] / values.length,
          ],
        }),
        bucketRanges
      )
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
