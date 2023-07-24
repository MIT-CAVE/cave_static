import PropTypes from 'prop-types'

import EchartsPlot from './BaseChart'

const BarPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  colors,
  stack = false,
}) => {
  return (
    <EchartsPlot
      data={data}
      chartType="bar"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat, stack, colors }}
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
