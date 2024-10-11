import * as R from 'ramda'

const calculateStatAnyDepth = (valueBuffers) => {
  const valueLists = R.map((buffer) => new Float64Array(buffer))(valueBuffers)
  const calculate = (group, calculation) => {
    // if there are no calculations just return values at the group indicies
    if (R.has(calculation, valueLists)) {
      return R.pipe((d) => d[calculation], R.pick(group), R.values)(valueLists)
    }
    console.error('calculation not found', calculation)
  }
  return calculate
}

onmessage = (e) => {
  const { valueBuffers, calculation, indicies } = e.data
  const calculate = calculateStatAnyDepth(valueBuffers)
  const result = calculate(indicies, calculation)
  postMessage(result)
}
