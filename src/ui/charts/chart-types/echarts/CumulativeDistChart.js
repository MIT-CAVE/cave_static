import PropTypes from 'prop-types'

import { DistributionChart } from './DistributionChart'

/**
 * Renders a PDF chart.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */

const CumulativeDistributionChart = ({
  data,
  yAxisTitle,
  numberFormat,
  colors,
  cumulative = true,
  stack = false,
  area = false,
}) => {
  return (
    <DistributionChart
      xAxisTitle={yAxisTitle}
      yAxisTitle="Cumulative Density"
      {...{ data, numberFormat, stack, colors, area, cumulative }}
    ></DistributionChart>
  )
}
CumulativeDistributionChart.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  cumulative: PropTypes.bool,
  stack: PropTypes.bool,
  area: PropTypes.bool,
}

export { CumulativeDistributionChart }
