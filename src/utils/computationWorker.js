import * as R from 'ramda'

const group = (groupBys, statId, indicies, valueLists) => {
  const acc = {}
  for (let i = 0; i < indicies.length; i++) {
    let subAcc = acc
    for (let j = 0; j < groupBys.length; j++) {
      const idx = indicies[i]
      const key = R.join(' \u279D ')(groupBys[j][idx])
      if (j === groupBys.length - 1) {
        if (!(key in subAcc)) {
          subAcc[key] = 0
        }
        subAcc[key] += valueLists[statId][idx]
      } else {
        if (!(key in subAcc)) {
          subAcc[key] = {}
        }
        subAcc = subAcc[key]
      }
    }
  }
  return acc
}

onmessage = (e) => {
  const { valueLists, groupBys, statId, indicies } = e.data
  const valueArrays = R.map((d) => new Float64Array(d))(valueLists)
  const indiciesArr = new Uint32Array(indicies)
  const result = group(groupBys, statId, indiciesArr, valueArrays)
  postMessage(result)
}
