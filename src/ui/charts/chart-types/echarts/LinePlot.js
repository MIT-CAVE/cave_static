import PropTypes from 'prop-types'

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
  colors,
  stack = false,
  area = false,
  showNA,
}) => {
  return (
    <EchartsPlot
      data={data}
      chartType="line"
      seriesObj={area ? { areaStyle: { opacity: 1 }, smooth: !stack } : {}}
      {...{ xAxisTitle, yAxisTitle, numberFormat, stack, colors, showNA }}
    />
  )
}
LinePlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  area: PropTypes.bool,
  showNA: PropTypes.bool,
}

export { LinePlot }
