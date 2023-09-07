// As different types of globalOutputs grow, this may look like the renderProp pattern
// Perhaps combining props and globalOutputs is a better approach
import * as R from 'ramda'

import { globalOutputId, globalOutputVariant } from '../../../utils/enums'

import { KpiBasic, KpiHeadColumn, KpiHeadRow } from '../../compound'

const invalidType = (type) => {
  throw Error(`Invalid type '${type}' for a globalOutput`)
}

const invalidVariant = R.curry((type, variant) => {
  throw Error(`Invalid variant '${variant}' for prop type '${type}`)
})

const getKpiHeadRenderFn = R.cond([
  [R.isNil, R.always(KpiHeadColumn)],
  [R.equals(globalOutputVariant.COLUMN), R.always(KpiHeadColumn)],
  [R.equals(globalOutputVariant.ROW), R.always(KpiHeadRow)],
  [R.T, invalidVariant('head')],
])

const getKpiBasicRenderFn = R.ifElse(
  R.isNil,
  R.always(KpiBasic),
  invalidVariant('globalOutput')
)

const getKpiRenderFn = R.cond([
  [R.equals(globalOutputId.HEAD), R.always(getKpiHeadRenderFn)],
  [R.equals(globalOutputId.TEXT), R.always(getKpiBasicRenderFn)],
  [R.equals(globalOutputId.NUMBER), R.always(getKpiBasicRenderFn)],
  [R.T, invalidType],
])

// const getKpiMapRenderFn = R.ifElse(
//   R.includes(R.__, R.values(globalOutputId)),
//   R.always(R.always(KpiMap)), // An extra R.always to account for fn(variant)
//   invalidType
// )

const getRendererFn = R.always(getKpiRenderFn)

const renderKpi = ({ type = globalOutputId.NUMBER, variant, ...props }) => {
  const globalOutputViewRendererFn = getRendererFn()
  const globalOutputRendererFn = globalOutputViewRendererFn(type)
  const KpiComponent = globalOutputRendererFn(variant)
  return <KpiComponent {...props} />
}

export default renderKpi
