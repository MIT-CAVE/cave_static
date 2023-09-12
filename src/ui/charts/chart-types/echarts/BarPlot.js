import PropTypes from 'prop-types'

import EchartsPlot from './BaseChart'

const BarPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
  stack = false,
}) => {
  return (
    <EchartsPlot
      data={data}
      chartType="bar"
      {...{ xAxisTitle, yAxisTitle, numberFormat, stack, colors }}
    />
  )
}
BarPlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  stack: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export { BarPlot }
