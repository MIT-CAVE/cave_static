import * as R from 'ramda'
import { useMemo } from 'react'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps }) => {
  const hasSubgroups = R.has('children', R.head(data))
  const xLabels = R.pluck('name', data)
  const labels = R.pluck('label')(labelProps)
  const [xAxisLabel, lineLabel, barLabel] = R.pipe(
    R.map(R.replace(/\s*\[.*?\]/g, '')),
    hasSubgroups ? R.props([0, 2, 3]) : R.take(3)
  )(labels)

  const series = useMemo(() => {
    if (hasSubgroups) {
      const skus = {}

      data.forEach((item) => {
        item.children.forEach((child) => {
          if (!skus[child.name]) {
            skus[child.name] = { name: child.name, value: [], altValue: [] }
          }
        })
      })

      data.forEach((item) => {
        Object.keys(skus).forEach((skuName) => {
          const child = item.children.find((child) => child.name === skuName)
          if (child) {
            skus[skuName].value.push(child.value[0])
            skus[skuName].altValue.push(child.value[1])
          } else {
            skus[skuName].value.push(null)
            skus[skuName].altValue.push(null)
          }
        })
      })

      const processedData = [
        Object.values(skus).map((sku) => ({
          name: `${lineLabel}: ${sku.name}`,
          value: sku.value,
        })),
        Object.values(skus).map((sku) => ({
          name: `${barLabel}: ${sku.name}`,
          value: sku.altValue,
        })),
      ]

      return [
        ...processedData[0].map((sku) => ({
          name: sku.name,
          type: 'line',
          data: sku.value,
          yAxisIndex: 0,
        })),
        ...processedData[1].map((sku) => ({
          name: sku.name,
          type: 'bar',
          data: sku.value,
          yAxisIndex: 1,
        })),
      ]
    } else {
      const [lineData, barData] = R.pipe(R.pluck('value'), R.transpose)(data)
      return [
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
      ]
    }
  }, [barLabel, data, hasSubgroups, lineLabel])

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
    series,
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
