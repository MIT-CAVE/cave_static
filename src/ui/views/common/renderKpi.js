// As different types of KPIs grow, this may look like the renderProp pattern
// Perhaps combining props and kpis is a better approach
import * as R from 'ramda'

import { viewId, kpiId } from '../../../utils/enums'

import { KpiBasic, KpiHead, KpiMap } from '../../compound'

const invalidType = (type) => {
  throw Error(`Invalid type '${type}' for a KPI`)
}

const getKpiRenderFn = R.cond([
  [R.equals(kpiId.HEAD), R.always(KpiHead)],
  [R.equals(kpiId.TEXT), R.always(KpiBasic)],
  [R.equals(kpiId.NUMBER), R.always(KpiBasic)],
  [R.T, invalidType],
])

const getKpiMapRenderFn = R.ifElse(
  R.includes(R.__, R.values(kpiId)),
  R.always(KpiMap),
  invalidType
)

const getRendererFn = R.cond([
  [R.equals(viewId.KPI), R.always(getKpiRenderFn)],
  [R.equals(viewId.MAP), R.always(getKpiMapRenderFn)],
  [
    R.T,
    (view) => {
      throw Error(`Invalid view '${view}'`)
    },
  ],
])

const renderKpi = ({ view = viewId.KPI, type = kpiId.NUMBER, ...props }) => {
  const kpiRendererFn = getRendererFn(view)
  const KpiComponent = kpiRendererFn(type)
  return <KpiComponent {...props} />
}

export default renderKpi
