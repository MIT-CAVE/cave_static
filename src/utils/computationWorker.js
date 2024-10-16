import * as R from 'ramda'

const calculateStatAnyDepth = (valueBuffers) => {
  const valueLists = R.map((buffer) => new Float64Array(buffer))(valueBuffers)
  const calculate = (group, statId) => {
    // if there are no statIds just return values at the group indicies
    return R.pipe((d) => d[statId], R.pick(group), R.values, R.sum)(valueLists)
  }
  return calculate
}

onmessage = (e) => {
  const { valueBuffers, statId, indicies } = e.data
  const calculate = calculateStatAnyDepth(valueBuffers)
  const result = calculate(indicies, statId)
  postMessage(result)
}
