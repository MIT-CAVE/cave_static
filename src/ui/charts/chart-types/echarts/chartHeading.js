import * as R from 'ramda'

// Used until a chart has been measured
export const DEFAULT_SIZE = { width: 400, height: 300 }
// The space kept on the sides of the chart
export const PADDING = 12
// The labels of the chart (e.g., the heading) are only shown from this height up
export const MIN_LABEL_HEIGHT = 160
// The color of the names of the axes in the dark theme of ECharts, which is also
// the color of the stat label in the other charts (titles are brighter)
const AXIS_NAME_COLOR = '#cbcbce'

/**
 * The labels of a chart that has no axes to show them as the names of two: the
 * stat as a heading above it, and (if given) the grouping below it. They are
 * ECharts `title`s with the style of an axis name.
 * @param {{ width: number, height: number }} size The size of the chart.
 * @param {string} text The stat label.
 * @param {string} [groupText] The grouping label.
 * @returns {{ height: number, bottom: number, title: Object }} The height that
 * the heading takes at the top of the chart, the height that the grouping label
 * takes at the bottom, and the `title` option of the labels.
 */
export const getChartHeading = ({ width, height }, text, groupText) => {
  const fontSize = R.clamp(12, 20, Math.round(width / 20))
  const textStyle = {
    fontSize,
    // Titles are bold and brighter
    fontWeight: 'normal',
    color: AXIS_NAME_COLOR,
    width: width - 2 * PADDING,
    overflow: 'truncate',
  }
  const getHeight = (label) => fontSize * 1.2 * String(label).split('\n').length
  const show = height >= MIN_LABEL_HEIGHT

  const titles = []
  let top = 4
  let bottom = 0
  if (show && text) {
    top = 10 + getHeight(text) + 8
    titles.push({ text, left: 'center', top: 10, textStyle })
  }
  if (show && groupText) {
    bottom = getHeight(groupText) + 14
    titles.push({ text: groupText, left: 'center', bottom: 8, textStyle })
  }
  return {
    height: top,
    bottom,
    title: titles.length > 1 ? titles : (titles[0] ?? { show: false }),
  }
}
