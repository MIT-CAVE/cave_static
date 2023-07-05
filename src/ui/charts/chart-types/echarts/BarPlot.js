import PropTypes from 'prop-types'

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
      data={data}
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
