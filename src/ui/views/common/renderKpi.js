// As different types of KPIs grow, this may look like the renderProp pattern
// Perhaps combining props and kpis is a better approach
import * as R from 'ramda'

import { kpiId, kpiVariant } from '../../../utils/enums'

import { KpiBasic, KpiHeadColumn, KpiHeadRow } from '../../compound'

const invalidType = (type) => {
  throw Error(`Invalid type '${type}' for a KPI`)
}

const invalidVariant = R.curry((type, variant) => {
  throw Error(`Invalid variant '${variant}' for prop type '${type}`)
})

const getKpiHeadRenderFn = R.cond([
  [R.isNil, R.always(KpiHeadColumn)],
  [R.equals(kpiVariant.COLUMN), R.always(KpiHeadColumn)],
  [R.equals(kpiVariant.ROW), R.always(KpiHeadRow)],
  [R.T, invalidVariant('head')],
])

const getKpiBasicRenderFn = R.ifElse(
  R.isNil,
  R.always(KpiBasic),
  invalidVariant('kpi')
)

const getKpiRenderFn = R.cond([
  [R.equals(kpiId.HEAD), R.always(getKpiHeadRenderFn)],
  [R.equals(kpiId.TEXT), R.always(getKpiBasicRenderFn)],
  [R.equals(kpiId.NUMBER), R.always(getKpiBasicRenderFn)],
  [R.T, invalidType],
])

// const getKpiMapRenderFn = R.ifElse(
//   R.includes(R.__, R.values(kpiId)),
//   R.always(R.always(KpiMap)), // An extra R.always to account for fn(variant)
//   invalidType
// )

const getRendererFn = R.always(getKpiRenderFn)

const renderKpi = ({ type = kpiId.NUMBER, variant, ...props }) => {
  const kpiViewRendererFn = getRendererFn()
  const kpiRendererFn = kpiViewRendererFn(type)
  const KpiComponent = kpiRendererFn(variant)
  return <KpiComponent {...props} />
}

export default renderKpi
