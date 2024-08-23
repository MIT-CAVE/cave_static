import PropTypes from 'prop-types'

import EchartsPlot from './BaseChart'

const BarPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
  stack = false,
  showNA,
}) => {
  return (
    <EchartsPlot
      data={data}
      chartType="bar"
      {...{ xAxisTitle, yAxisTitle, numberFormat, stack, colors, showNA }}
    />
  )
}
BarPlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  stack: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  colors: PropTypes.object,
  showNA: PropTypes.bool,
}

export { BarPlot }
