import * as R from 'ramda'

import EchartsPlot from './BaseChart'

const CumulativeLineChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  subGrouped,
}) => {
  const accumulate = R.pipe(
    R.reduce((acc, value) => R.append(R.add(R.last(acc), value), acc), [0]),
    R.drop(1)
  )

  const yData = R.pluck('y')(data)

  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  const yKeysWithVals = R.pipe(
    R.map((val) => [val, 0]),
    R.fromPairs
  )(yKeys)

  const buildSubgroup = R.pipe(
    R.mapAccum(
      (acc, value) => [
        R.append(R.mergeWith(R.add, R.last(acc), value), acc),
        R.mergeWith(R.add, R.last(acc), value),
      ],
      [yKeysWithVals]
    ),
    R.last
  )

  return (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={subGrouped ? buildSubgroup(yData) : accumulate(yData)}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat, subGrouped }}
    />
  )
}

export { CumulativeLineChart }
