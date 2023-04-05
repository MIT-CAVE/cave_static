import PropTypes from 'prop-types'
import * as R from 'ramda'

import EchartsPlot from './BaseChart'

/**
 * Renders a line plot.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const LinePlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  subGrouped,
  theme,
}) => {
  return (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={R.pluck('y')(data)}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat, subGrouped }}
    />
  )
}
LinePlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  theme: PropTypes.string,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
}

export { LinePlot }
