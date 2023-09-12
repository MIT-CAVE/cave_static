import * as R from 'ramda'

import EchartsPlot from './BaseChart'

import { findSubgroupLabels } from '../../../../utils'

const CumulativeLineChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
}) => {
  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const accumulate = R.pipe(
    R.ifElse(
      // Check if subgrouped
      R.hasPath([0, 'children']),
      (data) => {
        const acc = R.zipObj(
          subGroupLabels,
          R.repeat(0, R.length(subGroupLabels))
        )
        return R.map((d) =>
          R.assoc(
            'children',
            R.map((child) => {
              acc[child.name] = R.add(acc[child.name], R.head(child.value))
              return R.assoc('value', [acc[child.name]], child)
            })(d.children),
            d
          )
        )(data)
      },
      R.pipe(
        R.mapAccum(
          (acc, item) => [
            R.add(acc, R.head(item.value)),
            R.assoc('value', [R.add(acc, R.head(item.value))], item),
          ],
          0
        ),
        R.last
      )
    )
  )

  return (
    <EchartsPlot
      data={accumulate(data)}
      chartType="line"
      {...{ xAxisTitle, yAxisTitle, numberFormat, colors }}
    />
  )
}

export { CumulativeLineChart }
