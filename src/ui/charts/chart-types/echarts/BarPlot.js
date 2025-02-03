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
  chartHoverOrder,
  path,
  xAxisOrder,
}) => {
  return (
    <EchartsPlot
      data={data}
      chartType="bar"
      {...{
        xAxisTitle,
        yAxisTitle,
        numberFormat,
        stack,
        colors,
        showNA,
        chartHoverOrder,
        path,
        xAxisOrder,
      }}
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
