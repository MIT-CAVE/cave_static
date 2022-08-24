// As different types of KPIs grow, this should mimic the renderProp pattern
// Perhaps combining props and kpis is a better approach
import * as R from 'ramda'

import { kpiId } from '../../../utils/enums'

import { KpiBasic, KpiMap } from '../../compound'

const getRenderer = R.cond([
  [R.equals(kpiId.BASIC), R.always(KpiBasic)],
  [R.equals(kpiId.MAP), R.always(KpiMap)],
  [
    R.T,
    (type) => {
      throw Error(`Invalid KPI type '${type}'`)
    },
  ],
])

const renderKpi = ({ type = kpiId.BASIC, ...props }) => {
  const KpiComponent = getRenderer(type)
  return <KpiComponent {...props} />
}

export default renderKpi
