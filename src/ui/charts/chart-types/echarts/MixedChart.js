import { Switch, FormControlLabel } from '@mui/material'
import * as R from 'ramda'
import { useMemo, useState } from 'react'

import { FlexibleChart } from './BaseChart'

const calculateAxesBounds = (leftData, rightData, syncAxes) => {
  const leftDataMin = Math.min(...R.filter(R.is(Number), leftData))
  const leftDataMax = Math.max(...R.filter(R.is(Number), leftData))
  const rightDataMin = Math.min(...R.filter(R.is(Number), rightData))
  const rightDataMax = Math.max(...R.filter(R.is(Number), rightData))
  const leftMin = syncAxes
    ? Math.min(leftDataMin, rightDataMin)
    : -Math.max(Math.abs(leftDataMin), Math.abs(leftDataMax))
  const leftMax = syncAxes ? Math.max(leftDataMax, rightDataMax) : -leftMin
  const rightMin = syncAxes
    ? leftMin
    : -Math.max(Math.abs(rightDataMin), Math.abs(rightDataMax))
  const rightMax = syncAxes ? leftMax : -rightMin
  return { leftMin, leftMax, rightMin, rightMax }
}

const isCumulative = (variant, data) => {
  return variant === 'cumulative line' && R.all(R.complement(R.isNil))(data)
}

const accumulate = (data) => {
  return R.compose(R.tail, R.scan(R.add, 0))(data)
}

const MixedChart = ({ data, labelProps, leftVariant, rightVariant }) => {
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
      'cumulative line': 'line',
      bar: 'bar',
    }

    if (hasSubgroups) {
      const subGroups = R.reduce(
        (acc, item) => {
          R.forEach((child) => {
            if (!R.find((sg) => sg.name === child.name, acc)) {
              acc.push({ name: child.name, leftData: [], rightData: [] })
            }
          }, item.children)
          return acc
        },
        [],
        data
      )

      R.forEach((item) => {
        R.forEach((subgroup) => {
          const child = R.find(
            (child) => child.name === subgroup.name,
            item.children
          )
          subgroup.leftData.push(child ? child.value[0] : undefined)
          subgroup.rightData.push(child ? child.value[1] : undefined)
        }, subGroups)
      }, data)

      R.forEach((subgroup) => {
        if (isCumulative(leftVariant, subgroup.leftData)) {
          subgroup.leftData = accumulate(subgroup.leftData)
        }
        if (isCumulative(rightVariant, subgroup.rightData)) {
          subgroup.rightData = accumulate(subgroup.rightData)
        }
      }, subGroups)

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
            name: `${leftLabelWithoutUnits}: ${sg.name}`,
            type: variantType[leftVariant],
            data: sg.leftData,
            yAxisIndex: 0,
            smooth: variantType[leftVariant] === 'line' ? true : undefined,
          })),
          subGroups.map((sg) => ({
            name: `${rightLabelWithoutUnits}: ${sg.name}`,
            type: variantType[rightVariant],
            data: sg.rightData,
            yAxisIndex: 1,
            smooth: variantType[rightVariant] === 'line' ? true : undefined,
          })),
        ]),
        leftMin,
        leftMax,
        rightMin,
        rightMax,
      }
    } else {
      const leftValues = R.pipe(R.pluck('value'), R.map(R.head))(data)
      const leftData = isCumulative(leftVariant, leftValues)
        ? accumulate(leftValues)
        : leftValues
      const rightValues = R.pipe(R.pluck('value'), R.pluck(1))(data)
      const rightData = isCumulative(rightVariant, rightValues)
        ? accumulate(rightValues)
        : rightValues
      const { leftMin, leftMax, rightMin, rightMax } = calculateAxesBounds(
        leftData,
        rightData,
        syncAxes
      )
      return {
        series: [
          {
            name: leftLabelWithoutUnits,
            type: variantType[leftVariant],
            data: leftData,
            yAxisIndex: 0,
            smooth: variantType[leftVariant] === 'line' ? true : undefined,
          },
          {
            name: rightLabelWithoutUnits,
            type: variantType[rightVariant],
            data: rightData,
            yAxisIndex: 1,
            smooth: variantType[rightVariant] === 'line' ? true : undefined,
          },
        ],
        leftMin,
        leftMax,
        rightMin,
        rightMax,
      }
    }
  }, [
    data,
    hasSubgroups,
    leftVariant,
    rightVariant,
    leftLabelWithoutUnits,
    rightLabelWithoutUnits,
    labels,
    syncAxes,
  ])
  if (R.isNil(calcData)) return []

  const createYAxis = (name, rotate, min, max) => ({
    type: 'value',
    name,
    nameGap: 50,
    min: min,
    max: max,
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
    yAxis: [
      createYAxis(leftLabel, 90, calcData.leftMin, calcData.leftMax),
      createYAxis(rightLabel, -90, calcData.rightMin, calcData.rightMax),
    ],
    series: calcData.series,
  }
  return (
    <>
      <FlexibleChart {...{ options }} />
      <FormControlLabel
        sx={{ position: 'absolute', right: 65, top: 10 }}
        control={
          <Switch
            checked={syncAxes}
            onChange={(e) => setSyncAxes(e.target.checked)}
          />
        }
        label="Sync axes?"
        labelPlacement="start"
      />
    </>
  )
}

export { MixedChart }
