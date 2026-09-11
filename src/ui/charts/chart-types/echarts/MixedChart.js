import * as R from 'ramda'
import { useMemo, useState } from 'react'

import { FlexibleChart } from './BaseChart'

import { findColoring, getChartItemColor } from '../../../../utils'

const calculateAxesBounds = (leftData, rightData, syncAxes) => {
  const leftDataMin = Math.min(...R.filter(R.is(Number), leftData))
  const leftDataMax = Math.max(...R.filter(R.is(Number), leftData))
  const rightDataMin = Math.min(...R.filter(R.is(Number), rightData))
  const rightDataMax = Math.max(...R.filter(R.is(Number), rightData))
  const zeroBased = leftDataMin >= 0 && rightDataMin >= 0
  const leftMin = syncAxes
    ? Math.min(leftDataMin, rightDataMin, 0)
    : zeroBased
      ? 0
      : -Math.max(Math.abs(leftDataMin), Math.abs(leftDataMax))

  const leftMax = syncAxes ? Math.max(leftDataMax, rightDataMax) : leftDataMax
  const rightMin = syncAxes
    ? leftMin
    : zeroBased
      ? 0
      : -Math.max(Math.abs(rightDataMin), Math.abs(rightDataMax))
  const rightMax = syncAxes ? leftMax : rightDataMax
  return { leftMin, leftMax, rightMin, rightMax }
}
const isCumulative = (variant, data) => {
  return variant === 'cumulative_line' && R.all(R.complement(R.isNil))(data)
}
const accumulate = (data) => {
  return R.compose(R.tail, R.scan(R.add, 0))(data)
}
const getData = (index, variant, data) => {
  const values = R.pipe(R.pluck('value'), R.pluck(index))(data)
  return isCumulative(variant, values) ? accumulate(values) : values
}

const MixedChart = ({
  data,
  labelProps,
  leftVariant,
  rightVariant,
  chartHoverOrder,
  path,
  xAxisOrder,
  colors,
}) => {
  const [syncAxes, setSyncAxes] = useState(true)
  const hasSubgroups = R.has('children', R.head(data))
  const xLabels = R.pluck('name', data)
  const labels = R.pluck('label')(labelProps)
  const [xAxisLabel, leftLabel, rightLabel] = hasSubgroups
    ? R.props([0, 2, 3])(labels)
    : R.take(3)(labels)
  const leftLabelWithoutUnits = leftLabel
    ? R.replace(/\s*\[.*?\]/g, '')(leftLabel)
    : ''
  const rightLabelWithoutUnits = rightLabel
    ? R.replace(/\s*\[.*?\]/g, '')(rightLabel)
    : ''

  const calcData = useMemo(() => {
    if (
      R.isNil(data) || R.isEmpty(data) || hasSubgroups
        ? !R.hasPath([0, 'children', 0, 'value', 1], data)
        : !R.hasPath([0, 'value', 1], data) ||
          R.any(R.equals('undefined'), labels)
    ) {
      return null
    }
    const variantType = {
      line: 'line',
      cumulative_line: 'line',
      bar: 'bar',
    }
    const smoothLeft = variantType[leftVariant] === 'line' ? true : undefined
    const smoothRight = variantType[rightVariant] === 'line' ? true : undefined

    if (hasSubgroups) {
      const subGroupsMap = new Map()
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (item.children) {
          for (let j = 0; j < item.children.length; j++) {
            const child = item.children[j]
            if (child && !subGroupsMap.has(child.name)) {
              subGroupsMap.set(child.name, {
                name: child.name,
                leftData: [],
                rightData: [],
              })
            }
          }
        }
      }
      const subGroups = Array.from(subGroupsMap.values())

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const childMap = new Map()
        if (item.children) {
          for (let j = 0; j < item.children.length; j++) {
            const child = item.children[j]
            if (child) childMap.set(child.name, child)
          }
        }
        for (let j = 0; j < subGroups.length; j++) {
          const subgroup = subGroups[j]
          const child = childMap.get(subgroup.name)
          subgroup.leftData.push(child ? child.value?.[0] : undefined)
          subgroup.rightData.push(child ? child.value?.[1] : undefined)
        }
      }

      for (let i = 0; i < subGroups.length; i++) {
        const subgroup = subGroups[i]
        if (isCumulative(leftVariant, subgroup.leftData)) {
          subgroup.leftData = accumulate(subgroup.leftData)
        }
        if (isCumulative(rightVariant, subgroup.rightData)) {
          subgroup.rightData = accumulate(subgroup.rightData)
        }
      }

      const leftData = R.chain(R.prop('leftData'), subGroups)
      const rightData = R.chain(R.prop('rightData'), subGroups)
      const { leftMin, leftMax, rightMin, rightMax } = calculateAxesBounds(
        leftData,
        rightData,
        syncAxes
      )
      return {
        series: R.flatten([
          subGroups.map((sg) => ({
            color: findColoring(sg.name, colors) ?? getChartItemColor(sg.name),
            name: `${leftLabelWithoutUnits}: ${sg.name}`,
            type: variantType[leftVariant],
            data: sg.leftData,
            yAxisIndex: 0,
            smooth: smoothLeft,
          })),
          subGroups.map((sg) => ({
            color: findColoring(sg.name, colors) ?? getChartItemColor(sg.name),
            name: `${rightLabelWithoutUnits}: ${sg.name}`,
            type: variantType[rightVariant],
            data: sg.rightData,
            yAxisIndex: 1,
            smooth: smoothRight,
          })),
        ]),
        leftMin,
        leftMax,
        rightMin,
        rightMax,
      }
    } else {
      const leftData = getData(0, leftVariant, data)
      const rightData = getData(1, rightVariant, data)
      const { leftMin, leftMax, rightMin, rightMax } = calculateAxesBounds(
        leftData,
        rightData,
        syncAxes
      )
      return {
        series: [
          {
            color:
              findColoring(leftLabelWithoutUnits, colors) ??
              getChartItemColor(leftLabelWithoutUnits),
            name: leftLabelWithoutUnits,
            type: variantType[leftVariant],
            data: leftData,
            yAxisIndex: 0,
            smooth: smoothLeft,
          },
          {
            color:
              findColoring(rightLabelWithoutUnits, colors) ??
              getChartItemColor(rightLabelWithoutUnits),
            name: rightLabelWithoutUnits,
            type: variantType[rightVariant],
            data: rightData,
            yAxisIndex: 1,
            smooth: smoothRight,
          },
        ],
        leftMin,
        leftMax,
        rightMin,
        rightMax,
      }
    }
  }, [
    colors,
    data,
    hasSubgroups,
    labels,
    leftLabelWithoutUnits,
    leftVariant,
    rightLabelWithoutUnits,
    rightVariant,
    syncAxes,
  ])
  if (R.isNil(calcData)) return []

  const createYAxis = (name, rotate, min, max) => ({
    type: 'value',
    name,
    nameGap: 45,
    min: min,
    max: max,
    nameLocation: 'middle',
    nameRotate: rotate,
    nameTextStyle: {
      fontSize: 20,
    },
    axisLine: {
      show: true,
    },
    splitLine: {
      lineStyle: {
        type: [2, 5],
        dashOffset: 2,
        color: '#aaa',
        opacity: 0.7,
      },
    },
  })

  const options = {
    xAxis: {
      type: 'category',
      data: xLabels,
      name: xAxisLabel,
    },
    yAxis: [
      createYAxis(leftLabel, 90, calcData.leftMin, calcData.leftMax),
      createYAxis(rightLabel, -90, calcData.rightMin, calcData.rightMax),
    ],
    series: calcData.series,
  }
  return (
    <FlexibleChart
      {...{ options, chartHoverOrder, path, xAxisOrder, syncAxes }}
      onSyncAxesChange={setSyncAxes}
    />
  )
}

export { MixedChart }
