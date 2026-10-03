import PropTypes from 'prop-types'
import { useState, useMemo } from 'react'

import EchartsPlot from './BaseChart'

import { findSubgroupLabels } from '../../../../utils'

const formatToSignificantFigures = (num, sigFigs) => {
  if (num == null || typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return 0
  }
  return Number.parseFloat(num.toPrecision(sigFigs))
}

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
  chartHoverOrder,
}) => {
  const [numBuckets, setNumBuckets] = useState(10)

  const calcDistributionData = useMemo(() => {
    if (!data || data.length === 0) return []
    const hasSubgroups = data[0] && 'children' in data[0]
    const values = (
      hasSubgroups
        ? data.flatMap((obj) =>
            (obj?.children || []).flatMap((c) =>
              Array.isArray(c?.value) ? c.value : [c?.value]
            )
          )
        : data.flatMap((val) =>
            Array.isArray(val?.value) ? val.value : [val?.value]
          )
    ).filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))

    if (values.length === 0) return []

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const validBuckets = Math.max(
      1,
      typeof numBuckets === 'number' && !isNaN(numBuckets) ? numBuckets : 10
    )
    const bucketSize =
      maxValue === minValue ? 1 : (maxValue - minValue) / validBuckets

    // initialize array with bucket ranges
    const bucketRanges = Array.from({ length: validBuckets }, (_, i) => ({
      min: formatToSignificantFigures(minValue + i * bucketSize, 3),
      max: formatToSignificantFigures(minValue + (i + 1) * bucketSize, 3),
    }))

    if (hasSubgroups) {
      const yValues = data.map((d) => d?.children || [])
      const flattenedYValues = yValues.flat().filter(Boolean)
      const subGroupLabels = findSubgroupLabels(yValues)
      if (subGroupLabels.length === 0) return []

      const subGroupCounts = {}
      for (let i = 0; i < flattenedYValues.length; i++) {
        const item = flattenedYValues[i]
        const vals = (
          Array.isArray(item?.value) ? item.value : [item?.value]
        ).filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))
        subGroupCounts[item.name] =
          (subGroupCounts[item.name] || 0) + vals.length
      }

      // initialize buckets, setting all subGroup counts to 0
      const buckets = Array.from({ length: validBuckets }, () => {
        const b = {}
        for (let i = 0; i < subGroupLabels.length; i++) {
          b[subGroupLabels[i]] = 0
        }
        return b
      })

      // add each data object to corresponding bucket
      for (let i = 0; i < flattenedYValues.length; i++) {
        const obj = flattenedYValues[i]
        const vals = (
          Array.isArray(obj?.value) ? obj.value : [obj?.value]
        ).filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))
        for (let j = 0; j < vals.length; j++) {
          const val = vals[j]
          const bucketIndex = Math.min(
            Math.max(0, Math.floor((val - minValue) / (bucketSize || 1))),
            validBuckets - 1
          )
          if (buckets[bucketIndex] && obj.name in buckets[bucketIndex]) {
            buckets[bucketIndex][obj.name]++
          }
        }
      }

      // calculate final buckets based on PDF/CDF
      const finalBuckets = cumulative
        ? buckets.reduce((acc, currentBucket) => {
            if (acc.length === 0) return [currentBucket]
            const last = acc[acc.length - 1]
            const merged = { ...currentBucket }
            for (const key of Object.keys(merged)) {
              merged[key] = (merged[key] || 0) + (last[key] || 0)
            }
            acc.push(merged)
            return acc
          }, [])
        : buckets

      // return new data
      return bucketRanges.map((range, index) => ({
        name: `[${range.min},${range.max})`,
        children: Object.entries(finalBuckets[index] || {}).map(
          ([key, val]) => ({
            name: key,
            value: counts
              ? [val]
              : [subGroupCounts[key] ? val / subGroupCounts[key] : 0],
          })
        ),
      }))
    } else {
      // initialize buckets and add each value to corresponding bucket
      const buckets = new Array(validBuckets).fill(0)
      for (let i = 0; i < values.length; i++) {
        const val = values[i]
        const bucketIndex = Math.min(
          Math.max(0, Math.floor((val - minValue) / (bucketSize || 1))),
          validBuckets - 1
        )
        buckets[bucketIndex]++
      }

      // calculate final buckets based on PDF/CDF
      const finalBuckets = cumulative
        ? buckets
            .reduce(
              (acc, curr) => {
                const last = acc[acc.length - 1]
                acc.push(last + curr)
                return acc
              },
              [0]
            )
            .slice(1)
        : buckets

      // return new data
      return bucketRanges.map((range, index) => ({
        name: `[${range.min},${range.max})`,
        value: [
          counts
            ? finalBuckets[index]
            : values.length > 0
              ? finalBuckets[index] / values.length
              : 0,
        ],
      }))
    }
  }, [data, numBuckets, cumulative, counts])

  if (calcDistributionData.length === 0) {
    return <></>
  }

  return (
    <EchartsPlot
      distribution={true}
      data={calcDistributionData}
      seriesObj={area ? { areaStyle: { opacity: 1 }, smooth: !stack } : {}}
      onNumBucketsChange={setNumBuckets}
      {...{
        numberFormat,
        stack,
        colors,
        xAxisTitle,
        yAxisTitle,
        chartType,
        chartHoverOrder,
        numBuckets,
      }}
    />
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
