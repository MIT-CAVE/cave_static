const group = (groupBys, indicies, valueLists, parentLengths, groupLength) => {
  const acc = {}
  for (let i = 0; i < indicies.length; i++) {
    let subAcc = acc
    let baseLength = 0
    for (let j = 0; j < parentLengths.length; j++) {
      const idx = indicies[i]
      const key = groupBys
        .slice(
          parentLengths[j] * idx + baseLength,
          parentLengths[j] * (idx + 1) + baseLength
        )
        .join(' \u279D ')
      if (j === parentLengths.length - 1) {
        if (!(key in subAcc)) {
          subAcc[key] = 0
        }
        subAcc[key] += valueLists[idx]
      } else {
        if (!(key in subAcc)) {
          subAcc[key] = {}
        }
        subAcc = subAcc[key]
      }
      baseLength += parentLengths[j] * groupLength
    }
  }
  return acc
}

onmessage = (e) => {
  const { valueList, groupBys, indicies, parentLengths, groupLength } = e.data
  const indiciesArr = new Uint32Array(indicies)
  const valueListArr = new Float64Array(valueList)
  const result = group(
    groupBys,
    indiciesArr,
    valueListArr,
    parentLengths,
    groupLength
  )
  postMessage(result)
}
