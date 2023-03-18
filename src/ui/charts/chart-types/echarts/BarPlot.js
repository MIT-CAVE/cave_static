import PropTypes from 'prop-types'
import * as R from 'ramda'

import EchartsPlot from './BaseChart'

const BarPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  stack = false,
}) => {
  return (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={R.pluck('y')(data)}
      chartType="bar"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat, stack }}
    />
  )
}
BarPlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  theme: PropTypes.string,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  stack: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export { BarPlot }
