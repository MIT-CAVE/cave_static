import * as R from 'ramda'
import { useMemo } from 'react'

import { FlexibleChart } from './BaseChart'

const MixedChart = ({ data, labelProps, leftVariant, rightVariant }) => {
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

      return {
        series: R.flatten([
          subGroups.map((sg) => ({
            name: `${leftLabelWithoutUnits}: ${sg.name}`,
            type: variantType[leftVariant],
            data: sg.leftData,
            yAxisIndex: 0,
          })),
          subGroups.map((sg) => ({
            name: `${rightLabelWithoutUnits}: ${sg.name}`,
            type: variantType[rightVariant],
            data: sg.rightData,
            yAxisIndex: 1,
          })),
        ]),
        min: Math.min(
          ...R.filter(R.is(Number), leftData),
          ...R.filter(R.is(Number), rightData)
        ),
        max: Math.max(
          ...R.filter(R.is(Number), leftData),
          ...R.filter(R.is(Number), rightData)
        ),
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
      return {
        series: [
          {
            name: leftLabelWithoutUnits,
            type: variantType[leftVariant],
            data: finalLeftData,
            yAxisIndex: 0,
          },
          {
            name: rightLabelWithoutUnits,
            type: variantType[rightVariant],
            data: finalRightData,
            yAxisIndex: 1,
          },
        ],
        min: Math.min(...finalLeftData, ...finalRightData),
        max: Math.max(...finalLeftData, ...finalRightData),
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
  ])

  if (R.isNil(calcData)) return []

  const createYAxis = (name, rotate) => ({
    type: 'value',
    name,
    nameGap: 50,
    min: calcData.min,
    max: calcData.max,
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
    yAxis: [createYAxis(leftLabel, 90), createYAxis(rightLabel, -90)],
    series: calcData.series,
  }
  return <FlexibleChart {...{ options }} />
}

export { MixedChart }
