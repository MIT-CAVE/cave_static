import { Parser } from 'expr-eval'
import * as R from 'ramda'

const parseArray = (input) => {
  var s = input
  // remove leading [ and trailing ] if present
  if (input[0] === '[') {
    s = R.drop(1, s)
  }
  if (R.last(input) === ']') {
    s = R.dropLast(1, s)
  }
  // create an arrray, splitting on every ,
  var items = s.split(',')
  return R.map(R.trim)(items)
}

const calculateStatAnyDepth = (valueBuffers) => {
  const valueLists = R.map((buffer) => new Float64Array(buffer))(valueBuffers)
  const parser = new Parser()
  const calculate = (group, calculation) => {
    // if there are no calculations just return values at the group indicies
    if (R.has(calculation, valueLists)) {
      return R.pipe((d) => d[calculation], R.pick(group), R.values)(valueLists)
    }
    // define groupSum for each base level group
    const preSummed = {}
    parser.functions.groupSum = (statName) => {
      // groupSum only works for non-derived stats
      // dont recalculate sum for each stat
      if (R.isNil(preSummed[statName])) {
        preSummed[statName] = R.sum(
          R.map((idx) => valueLists[statName][idx], group)
        )
      }
      return preSummed[statName]
    }
    return group.map((idx) => {
      const proxy = new Proxy(valueLists, {
        get(target, name, receiver) {
          return Reflect.get(target, name, receiver)[idx]
        },
      })
      try {
        return parser.parse(calculation).evaluate(
          // evaluate each list item
          proxy
        )
      } catch {
        console.warn(`Malformed calculation: ${calculation}`)
        // if calculation is malformed return simplified array
        return parseArray(
          parser
            .parse(calculation)
            .simplify(
              // evaluate each list item
              proxy
            )
            .toString()
        )
      }
    })
  }
  return calculate
}

onmessage = (e) => {
  const { valueBuffers, calculation, indicies } = e.data
  const calculate = calculateStatAnyDepth(valueBuffers)
  const result = calculate(indicies, calculation)
  postMessage(result)
}
