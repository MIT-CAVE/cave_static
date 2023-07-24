import PropTypes from 'prop-types'

import EchartsPlot from './BaseChart'

/**
 * Renders a line plot.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const LinePlot = ({ data, xAxisTitle, yAxisTitle, numberFormat, theme }) => {
  return (
    <EchartsPlot
      data={data}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat }}
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
