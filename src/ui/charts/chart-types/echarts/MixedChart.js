import { Switch, FormControlLabel } from '@mui/material'
import * as R from 'ramda'
import { useMemo, useState } from 'react'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps, leftVariant, rightVariant }) => {
  const [syncAxes, setSyncAxes] = useState(false)
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
          subgroup.leftData.push(child ? child.value[0] : null)
          subgroup.rightData.push(child ? child.value[1] : null)
        }, subGroups)
      }, data)

      R.forEach((subgroup) => {
        if (
          leftVariant === 'cumulative line' &&
          R.all(R.complement(R.isNil))(subgroup.leftData)
        ) {
          subgroup.leftData = R.compose(
            R.tail,
            R.scan(R.add, 0)
          )(subgroup.leftData)
        }
        if (
          rightVariant === 'cumulative line' &&
          R.all(R.complement(R.isNil))(subgroup.rightData)
        ) {
          subgroup.rightData = R.compose(
            R.tail,
            R.scan(R.add, 0)
          )(subgroup.rightData)
        }
      }, subGroups)

      const leftData = R.chain(R.prop('leftData'), subGroups)
      const rightData = R.chain(R.prop('rightData'), subGroups)
      const leftMin = Math.min(...R.filter(R.is(Number), leftData))
      const leftMax = Math.max(...R.filter(R.is(Number), leftData))
      const rightMin = Math.min(...R.filter(R.is(Number), rightData))
      const rightMax = Math.max(...R.filter(R.is(Number), rightData))
      const leftMinAfterSync = syncAxes
        ? Math.min(leftMin, rightMin)
        : -Math.max(Math.abs(leftMin), Math.abs(leftMax))
      const leftMaxAfterSync = syncAxes
        ? Math.max(leftMax, rightMax)
        : -leftMinAfterSync
      const rightMinAfterSync = syncAxes
        ? leftMinAfterSync
        : -Math.max(Math.abs(rightMin), Math.abs(rightMax))
      const rightMaxAfterSync = syncAxes ? leftMaxAfterSync : -rightMinAfterSync

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
        leftMin: leftMinAfterSync,
        leftMax: leftMaxAfterSync,
        rightMin: rightMinAfterSync,
        rightMax: rightMaxAfterSync,
      }
    } else {
      const [leftData, rightData] = R.pipe(R.pluck('value'), R.transpose)(data)
      const finalLeftData =
        leftVariant === 'cumulative line' &&
        R.all(R.complement(R.isNil))(leftData)
          ? R.compose(R.tail, R.scan(R.add, 0))(leftData)
          : leftData
      const finalRightData =
        rightVariant === 'cumulative line' &&
        R.all(R.complement(R.isNil))(rightData)
          ? R.compose(R.tail, R.scan(R.add, 0))(rightData)
          : rightData
      const leftMin = Math.min(...R.filter(R.is(Number), finalLeftData))
      const leftMax = Math.max(...R.filter(R.is(Number), finalLeftData))
      const rightMin = Math.min(...R.filter(R.is(Number), finalRightData))
      const rightMax = Math.max(...R.filter(R.is(Number), finalRightData))
      const leftMinAfterSync = syncAxes
        ? Math.min(leftMin, rightMin)
        : -Math.max(Math.abs(leftMin), Math.abs(leftMax))
      const leftMaxAfterSync = syncAxes
        ? Math.max(leftMax, rightMax)
        : -leftMinAfterSync
      const rightMinAfterSync = syncAxes
        ? leftMinAfterSync
        : -Math.max(Math.abs(rightMin), Math.abs(rightMax))
      const rightMaxAfterSync = syncAxes ? leftMaxAfterSync : -rightMinAfterSync
      return {
        series: [
          {
            name: leftLabelWithoutUnits,
            type: variantType[leftVariant],
            data: finalLeftData,
            yAxisIndex: 0,
            smooth: variantType[leftVariant] === 'line' ? true : undefined,
          },
          {
            name: rightLabelWithoutUnits,
            type: variantType[rightVariant],
            data: finalRightData,
            yAxisIndex: 1,
            smooth: variantType[rightVariant] === 'line' ? true : undefined,
          },
        ],
        leftMin: leftMinAfterSync,
        leftMax: leftMaxAfterSync,
        rightMin: rightMinAfterSync,
        rightMax: rightMaxAfterSync,
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
          <Switch value={syncAxes} onChange={() => setSyncAxes(!syncAxes)} />
        }
        label="Sync axes?"
        labelPlacement="start"
      />
    </>
  )
}

export { MixedChart }
